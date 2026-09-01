# Spike: Investigate fuzzy matching for searching proprietor name

https://github.com/DigitalCommons/land-explorer-back-end/issues/79

## Options evaluated

### MySQL Natural Language Full-Text Searches

The search results are sorted with a relevance value. Relevance is computed based on:

- The number of words in the row
- The number of unique words in that row
- The total number of words in the collection
- The number of documents (rows) that contain a particular word.

Searches are case-insensitive and will only match the full text so would not match `Councils` for example or any spelling mistakes.

### MySQL Soundex

This allows you to match words that sound similar but may be spelled differently.
A quick test with this ruled it out as an option quickly:
```sql
SELECT *
FROM proprietors
WHERE SOUNDEX(name) = SOUNDEX('bristle City Council');
```

<img width="526" height="79" alt="Image" src="https://github.com/user-attachments/assets/efd8f910-4277-45c3-b477-c704e4c39543" />

However, searching for

```sql
SELECT *
FROM proprietors
WHERE SOUNDEX(name) = SOUNDEX('bristle Council');
```

Returns no results.

### MySQL DamerauLevenshtein

I briefly looked at this algorithm as a way of doing fuzzy searching in MySQL, which would also handle spelling mistakes. However, this is not built in to MySQL - there are various functions online that people have written. I decided not to investigate this further as the consensus is that it is slow on large datasets and I wouldn't want to manage quirks with a user defined function.

### Meilisearch

This is an open source search engine that handles quick searching and typo tolerance.

### Typesense

This is an open source search engine that handles quick searching and typo tolerance.

## Setup

### MySQL

- Needs a new `Proprietor` table creating in the current MySQL database with the `proprietorName` having the `FULLTEXT` index.
- The pipeline in the property boundaries service would need to insert into this table as well as the `LandOwnerships` table.

For the investigations below, I inserted ~600,000 proprietor records locally into a new proprietors table with the `name` column indexed using the FULLTEXT index.

### Meilisearch

- A dockerised version of Meilisearch would need to be deployed to our servers. There are [docs here on self hosting Meilisearch](https://www.meilisearch.com/docs/learn/self_hosted/getting_started_with_self_hosted_meilisearch) and [docs here on running Meilisearch via docker](https://www.meilisearch.com/docs/guides/docker#run-meilisearch-with-docker).
- We would need to insert all our proprietors into this index and ensure the pipeline in the property boundaries service adds any new proprietors to this index.

Note that there is a cloud version of Meilisearch. Pricing is here -> https://www.meilisearch.com/pricing.
This would be a simpler setup but has ongoing costs.

For these investigations, I ran Meilisearch locally and inserted the same ~600,000 proprietor records into an index.

### Typesense

- A dockerised version of Typesense would need to be deployed to our servers. There are [docs here on self hosting Typesense with docker here](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting).
- We would need to insert all our proprietors into this index and ensure the pipeline in the property boundaries service adds any new proprietors to this index.

Note that there is a cloud version of Typesense. https://typesense.org/docs/guide/install-typesense.html#option-1-typesense-cloud.
This would be a simpler setup but has ongoing costs.

[Also note that they have a javascript client](https://typesense.org/docs/guide/installing-a-client.html)

For these investigations, I ran Typesense locally in docker and inserted the same ~600,000 proprietor records into a collection.

## Test 1 - Phrase Search

Search term = `Bristol Council`

### MySQL Natural Language Full-Text Searches

```sql
SELECT id,create_time,name, MATCH(name) AGAINST ('Bristol Council'IN NATURAL LANGUAGE MODE) AS score
FROM proprietors WHERE MATCH(name) AGAINST('Bristol Council' IN NATURAL LANGUAGE MODE) LIMIT 20;
```
<img width="1602" height="684" alt="Image" src="https://github.com/user-attachments/assets/45114461-f043-483b-b659-bed7d8a818bf" />

### Meilisearch

POST http://localhost:7700/indexes/proprietors/search

```json
{
  "q": "Bristol Council",
  "limit": 10
}
```

Returns the following dataset

<img width="938" height="804" alt="Image" src="https://github.com/user-attachments/assets/bb103898-642a-4530-a800-b41623fffbea" />

### Typesense

GET http://localhost:8109/collections/proprietors/documents/search\?q=bristol%20council&query_by=name

The result set is much more verbose than Meilisearch. Each document returned has the following info:

<img width="446" height="537" alt="Image" src="https://github.com/user-attachments/assets/a4db1aee-b9e4-4afb-98fa-2c807f8b1cab" />

I won't screenshot the whole response as it is too large, instead I will list the proprietor names returned.

For this search Typesense returned 9 documents only.
They were as follows in this order:

```json
[
  "THE CITY COUNCIL BRISTOL",
  "THE CITY OF BRISTOL COUNCIL",
  "THE CITY COUNCIL OF BRISTOL BRISTOL",
  "THE CITY OF THE COUNCIL OF BRISTOL",
  "BRISTOL CITY COUNCIL",
  "CITY COUNCIL OF BRISTOL",
  "THE CITY COUNCIL OF BRISTOL",
  "THE INCUMBENT FOR THE TIME BEING OF THE BENEFICE OF WESTBURY PARK ST ALBAN IN THE COUNTY  COUNCIL AND DIOCESE OF BRISTOL AND HIS SUCCESSORS",
  "THE COUNCIL OF THE CITY OF BRISTOL"
]
```

### Observations

- MySQL ranks based on term frequency rather than intent - the top result contained 4 instances of Bristol and 0 of Council.
- Meilisearch balances recall and relevance.
- Typesense is stricter and returns fewer, highly relevant results.

## Test 2 - Spelling mistakes/typos

Search term = `Britol Council`

### MySQL Natural Language Full-Text Searches

```sql
SELECT id,create_time,name, MATCH(name) AGAINST ('Britol Council'IN NATURAL LANGUAGE MODE) AS score
FROM proprietors WHERE MATCH(name) AGAINST('Britol Council' IN NATURAL LANGUAGE MODE) LIMIT 10;
```

<img width="1261" height="366" alt="Image" src="https://github.com/user-attachments/assets/3ac02c3f-b38e-463c-a686-94cea7d28b04" />

### Meilisearch

POST http://localhost:7700/indexes/proprietors/search

```json
{
  "q": "Britol Council",
  "limit": 10
}
```

<img width="419" height="795" alt="Image" src="https://github.com/user-attachments/assets/311a032f-9902-48eb-93a5-6639aac245ea" />

## Typesense

11 matches

```json
[
  "THE CITY COUNCIL BRISTOL",
  "THE CITY OF BRISTOL COUNCIL",
  "THE CITY COUNCIL OF BRISTOL BRISTOL",
  "THE CITY OF THE COUNCIL OF BRISTOL",
  "BRISTOL CITY COUNCIL",
  "CITY COUNCIL OF BRISTOL",
  "THE CITY COUNCIL OF BRISTOL",
  "BRITON FERRY COMMUNITY COUNCIL",
  "BRITON FERRY TOWN COUNCIL",
  "THE INCUMBENT FOR THE TIME BEING OF THE BENEFICE OF WESTBURY PARK ST ALBAN IN THE COUNTY  COUNCIL AND DIOCESE OF BRISTOL AND HIS SUCCESSORS"
]
```

### Observations

- Both Meilisearch and Typesense handle typos well out of the box.
- MySQL is not suitable for fuzzy search - it ignored the Britol part of the search term.

## Test 3 - Partial word matching

We’ll need to decide in the UI how many characters a user must type before autocomplete begins returning results. While it’s not essential that these early suggestions are highly accurate, it’s still worth evaluating how well this performs.

Search term = `Brist`

### MySQL Natural Language Full-Text Searches

```sql
SELECT id,create_time,name, MATCH(name) AGAINST ('Brist' IN NATURAL LANGUAGE MODE) AS score FROM proprietors WHERE MATCH(name)
      AGAINST('Brist' IN NATURAL LANGUAGE MODE) LIMIT 20;
```

<img width="683" height="82" alt="Image" src="https://github.com/user-attachments/assets/2e15ec71-0e63-4f4c-954a-748cd6720fe3" />

### Meilisearch

POST http://localhost:7700/indexes/proprietors/search

```json
{
  "q": "Brist",
  "limit": 10
}
```

<img width="544" height="782" alt="Image" src="https://github.com/user-attachments/assets/093717fa-a4eb-4154-a7d9-dfb4fa2ad0d9" />

### Typesense

1661 matches

```json
[
  "BRIST ASSOCIATES SA",
  "S & L PROPERTY BRISTOL LTD",
  "HILLIER HOMES BRISTOL LTD",
  "EMPIRIC (BRISTOL CH) LIMITED",
  "THE TRUSTEES OF THE BRISTOL KURDISH COMMUNITY ASSOCIATION",
  "CONCRETE CONTRACTORS (BRISTOL) LTD",
  "BRISTOL HERITAGE HOMES LIMITED",
  "FERTILITY BRISTOL LIMITED",
  "R.H HOMES (BRISTOL) LTD",
  "NQ64 BRISTOL LTD"
]
```

### Observations

- Both Meilisearch and Typesense show good autocomplete behaviour
- MySQL does not return useful results

## Test 4- Alias search

i.e. Searching for `Ltd` instead of `Limited`

Search term = `mossacre ltd`

### MySQL Natural Language Full-Text Searches

```sql
SELECT id,create_time,name, MATCH(name) AGAINST ('mossacre ltd' IN NATURAL LANGUAGE MODE) AS score FROM proprietors WHERE MATCH(name)
      AGAINST('mossacre ltd' IN NATURAL LANGUAGE MODE) LIMIT 10;
```

<img width="1075" height="368" alt="Image" src="https://github.com/user-attachments/assets/73f3b4ca-40ec-400e-866d-c98b1b38888b" />

### Meilisearch

POST http://localhost:7700/indexes/proprietors/search

```json
{
  "q": "mossacre ltd",
  "limit": 10
}
```

<img width="397" height="781" alt="Image" src="https://github.com/user-attachments/assets/34f7f268-8f10-4026-86d6-94bea99e8ca0" />

### Typesense

2 matches

```json
[
  "MOSSCARE ST.VINCENTS HOUSING GROUP LTD",
  "MOSSCARE ST. VINCENTS HOUSING GROUP LTD"
]
```

### Observations

- Typesense requires additional configuration (synonyms) for this use case.
- Meilisearch handles this more naturally out of the box.
- MySQL did return a decent data set here

## Test 5 - Performance

### MySQL

The above queries have been between 20ms - 200ms.

### Meilisearch

Queries are < 50ms

### Typesense

Similarly queries are < 50ms

## Conclusions

From the above results, I think we can rule out MySQL for fuzzy searching. The limitations of only full text searching, not handling spelling mistakes and inaccurate relavancy rankings are all good reasons to rule this method out.

Typesense and Meilisearch are both very similar - they each have lots of settings that allow us to fine tune the data sets returned (I've just used the defaults for this spike).

One difference is the way they store data - Typesense uses RAM whereas Meilisearch uses disk. This makes Typesense quicker but Meilisearch scale better.
https://www.meilisearch.com/docs/resources/comparisons/typesense

I think both of these would work well for our use case. As seen by the alias matching test, Meilisearch is configured to be quicker to get going with out of the box and since our use case is quite simple and limited, I would go for Meilisearch.

## Further useful docs

### Meilisearch

There are many settings that can be changed from the default to fine tune the result sets returned. See the below for more info:

- [Docs on typo tolerance settings](https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance_settings)
- [Docs on settings for relevancy](https://www.meilisearch.com/docs/reference/api/settings/list-all-settings)
