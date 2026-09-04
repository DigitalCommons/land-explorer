import { useEffect, useState } from "react";
import LeftPaneTray from "./LeftPaneTray";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import RelatedProperty from "./RelatedProperty";
import Pagination from "../common/Pagination";
import {
  clearHighlightedProperties,
  fetchPropertyOwnerships,
  highlightProperties,
} from "../../actions/LandOwnershipActions";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import OwnershipYear from "./ownership-section/OwnershipYear";
import { RelatedProperties } from "@/reducers/LandOwnershipReducer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { SearchAlert, CircleX } from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

type LeftPaneRelatedPropertiesProps = {
  onClose: () => void;
  open: boolean;
  itemsPerPage: number;
};

const LeftPaneRelatedProperties = ({
  onClose,
  open,
  itemsPerPage,
}: LeftPaneRelatedPropertiesProps) => {
  const proprietorName = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesProprietorName,
  );
  const properties = useAppSelector(
    (state) => state.landOwnership.relatedProperties,
  );

  if (!proprietorName) {
    return;
  }

  return (
    <LeftPaneTray title="Ownership Search" open={open} onClose={onClose}>
      <div className="flex flex-col grow">
        <OwnershipSearch
          itemsPerPage={itemsPerPage}
          properties={properties}
          proprietorName={proprietorName}
        />
      </div>
      <div className="p-5 text-sm">
        <p>
          Information produced by HM Land Registry.
          <br />
          © Crown copyright 2020
          <br />
          Some data is displayed here for evaluation purposes only. For more
          information{" "}
          <a
            href="https://docs.google.com/document/d/1IzjiSknWgn4EqEJOd8SMdwuHdVHcu01TlCzL0B3xTm0/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>
        </p>
      </div>
    </LeftPaneTray>
  );
};

type OwnershipSearchProps = {
  itemsPerPage: number;
  properties: RelatedProperties;
  proprietorName: string;
};

const OwnershipSearch = ({
  itemsPerPage,
  properties,
  proprietorName,
}: OwnershipSearchProps) => {
  const error = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesError,
  );
  const loading = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesLoading,
  );
  const selectedYear = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesYear,
  );
  const displayRelatedProperties = useAppSelector(
    (state) => state.landOwnership.displayRelatedProperties,
  );

  const propertyCount = Object.keys(properties).length;

  // Chop up the properties into pages
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [proprietorName, selectedYear]);

  const noOfPages = Math.ceil(propertyCount / itemsPerPage);
  const indexOfLastProperty = currentPage * itemsPerPage;
  const indexOfFirstProperty = indexOfLastProperty - itemsPerPage;
  const propertiesOnThisPage = Object.values(properties).slice(
    indexOfFirstProperty,
    indexOfLastProperty,
  );

  const highlightedProperties = useAppSelector(
    (state) => state.landOwnership.highlightedProperties,
  );

  const hasHighlightedProperties = propertiesOnThisPage.some(
    (property) => highlightedProperties[property.title_no],
  );
  const dispatch = useAppDispatch();
  const handleRetrySearch = () => {
    dispatch(
      fetchPropertyOwnerships(
        selectedYear,
        new Date().getFullYear(),
        proprietorName,
      ),
    );
  };

  const selectAll = () => {
    dispatch(highlightProperties(properties));
  };

  const clearAll = () => {
    dispatch(clearHighlightedProperties(Object.keys(properties)));
  };

  const hasProperties = propertyCount > 0;

  let content;
  if (loading) {
    content = (
      <div className="flex items-center justify-center grow">
        <Spinner className="text-primary size-8 items-center"></Spinner>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex grow m-7">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <CircleX />
            </EmptyMedia>
            <EmptyTitle>We've experienced an error</EmptyTitle>
            <EmptyDescription>Please try again.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={handleRetrySearch}>
              Retry search
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  } else if (!hasProperties) {
    let month = "December";
    if (selectedYear === new Date().getFullYear()) {
      month = new Date().toLocaleString("default", { month: "long" });
    }
    content = (
      <div className="flex grow m-7">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <SearchAlert />
            </EmptyMedia>
            <EmptyTitle>No related properties found</EmptyTitle>
            <EmptyDescription>
              No properties found related to <strong>{proprietorName}</strong>{" "}
              in {month} {selectedYear}
            </EmptyDescription>
            <EmptyDescription>
              Try searching for a different year
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent></EmptyContent>
        </Empty>
      </div>
    );
  } else {
    content = (
      <>
        <div className="flex items-center gap-2 px-4 pb-4">
          <Button onClick={selectAll}>Select all</Button>
          {hasHighlightedProperties && (
            <Button variant="secondary" onClick={clearAll}>
              Clear all
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-properties">Highlight All Properties</Label>
            <Switch
              id="show-properties"
              checked={displayRelatedProperties}
              onCheckedChange={(value) =>
                dispatch({
                  type: "SET_DISPLAY_RELATED_PROPERTIES",
                  payload: value,
                })
              }
            />
          </div>
        </div>
        {propertiesOnThisPage.map((property) => (
          <div className="px-4" key={property.title_no}>
            <RelatedProperty property={property} />
          </div>
        ))}
        <div className="flex-1" />
        {noOfPages > 1 && (
          <Pagination
            pagesDisplayed={5}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            noOfPages={noOfPages}
            itemsPerPage={itemsPerPage}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex grow flex-col gap-4 border-b-primary">
      <div className="flex flex-col gap-2 px-4">
        <div className="pt-4 text-primary">{proprietorName}</div>
        {hasProperties && !loading && (
          <div>
            <span className="text-primary">{propertyCount}</span> associated
            properties
          </div>
        )}
      </div>
      {import.meta.env.VITE_FEATURE_HISTORIC_OWNERSHIP === "true" ? (
        <OwnershipYear />
      ) : null}
      <Separator />
      {content}
    </div>
  );
};

export default LeftPaneRelatedProperties;
