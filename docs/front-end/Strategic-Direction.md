# Simultaneous Map Editing

Many users have requested simultaneous map editing. [This PR](https://github.com/DigitalCommons/land-explorer-front-end/pull/310) implemented functionality that locks the map for a user to edit, and unlocks after 5 minutes of inactivity. To enable multiple users to edit the map simultaneously we need to do lots of refactoring, change the backend logic when maps are saved, and maybe add more API endpoints.

Across LX, when a map is saved the FE sends a snapshot of all of the map elements to the backend. This includes map data that we want to change for all simultaneous users - such as drawn features and their names and descriptions. It also includes map data that we don't want to change across simultaneous users - such as zoom level, map position, visible layers and search marker. The backend then has crude logic in which it deletes all the old markers, polygons, and lines and inserts the new objects, even if they didn't change or hardly changed.

In order to implement simultaneous editing to shared maps we will need to be able to make edits to maps for specific changes, rather than saving all map features at once. In practice this means separating out API endpoints for each possible edit, rather than a single endpoint that updates the whole map _or_ implementing clever logic in the BE which finds the diff of edits and only makes the minimum required changes to the database.

We also need a way of immediately sending updates from the BE back to FE clients when changes are made, probably by using the WebSocket architecture created in [this PR](https://github.com/DigitalCommons/land-explorer-front-end/pull/310). We will need to investigate how this impacts the load on our servers, and also carefully think about when we want to use WebSockets vs standard HTTP requests.

The following is the start of a list of endpoints needed that will impact all Viewers/Editors:
* Markers - CRUD functions on coords, name, description
* Lines - CRUD functions on start/end coords, name, description
* Polys - CRUD functions on each coord (including the number of coords), name, description
* Map name - Perhaps only editable by the map owner

The following is the start of a list of endpoints needed that will be unique for each map Viewer/Editors:
* Zoom level
* Map position
* Layers visible
* Search marker (or maybe change the way this works, so that it's just stored on the FE)

This is a big project. Our agreed approach is that we will start to move strategically in this direction. When the opportunity arises within other work to create one or more of these endpoints, we will do this. It is unlikely we'll be able to get through all of these without specific funding at some point. We **need** to include unit tests in estimates so that we have full coverage of new features in this area. Any design will be complex and very susceptible to bugs.

# Unit Test Coverage

There is very low unit test coverage across LX. Our intention is to add unit tests to all new functionality. It is imperative that unit testing is costed into new projects. This means Developers adding unit test time to their estimates and Product folk ensuring this is included. 

**FAQ**

_What if the budgets are tight?_ - I don't care.

_What if we don't have time?_ - I don't care... but also, don't stress yourself out. We're living through a mass extinction event and I'm writing about unit tests.

Please do treat this as a wiki and add any additional notes of information as it becomes available.