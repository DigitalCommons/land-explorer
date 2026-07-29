import { useState } from "react";
import LeftPaneTray from "./LeftPaneTray";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import RelatedProperty from "./RelatedProperty";
import Pagination from "../common/Pagination";
import {
  clearHighlightedProperties,
  fetchRelatedProperties,
  highlightProperties,
} from "../../actions/LandOwnershipActions";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

type Props = {
  onClose: () => void;
  open: boolean;
  itemsPerPage: number;
};

type OwnershipSearchProps = {
  itemsPerPage: number;
};

const OwnershipSearch = ({ itemsPerPage }: OwnershipSearchProps) => {
  const {
    relatedProperties: properties,
    relatedPropertiesError: error,
    relatedPropertiesProprietorName: proprietorName,
    relatedPropertiesLoading: loading,
  } = useAppSelector((state) => state.landOwnership);

  const propertyCount = Object.keys(properties).length;

  // Chop up the properties into pages
  const [currentPage, setCurrentPage] = useState(1);
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
    dispatch(fetchRelatedProperties(proprietorName!));
  };

  const selectAll = () => {
    dispatch(highlightProperties(properties));
  };

  const clearAll = () => {
    dispatch(clearHighlightedProperties(Object.keys(properties)));
  };

  const hasProperties = propertyCount > 0;

  if (loading)
    return (
      <div className="flex items-center justify-center grow">
        <Spinner className="text-primary size-8 items-center"></Spinner>
      </div>
    );

  if (error) {
    return (
      <>
        <div className="mx-8 my-4 text-center">
          We've experienced an error. Please try again.
        </div>
        {proprietorName && (
          <div className="flex grow justify-center">
            <Button size="lg" variant="secondary" onClick={handleRetrySearch}>
              Retry search
            </Button>
          </div>
        )}
      </>
    );
  }

  if (!hasProperties) {
    return (
      <div className="flex grow p-4 justify-center">No Related Properties</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-b-primary">
      <div className="flex flex-col gap-2 px-4">
        <div className="pt-4 text-primary">
          {propertiesOnThisPage[0].proprietor_name_1}
        </div>
        <div>
          <span className="text-primary">{propertyCount}</span> associated
          properties
        </div>
      </div>
      <Separator />
      <div className="flex items-center gap-2 px-4">
        <Button onClick={selectAll}>Select all</Button>
        {hasHighlightedProperties && (
          <Button variant="secondary" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>
      {propertiesOnThisPage.map((property) => (
        <div className="px-4">
          <RelatedProperty key={property.title_no} property={property} />
        </div>
      ))}
      {noOfPages > 1 && (
        <Pagination
          pagesDisplayed={5}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          noOfPages={noOfPages}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

const LeftPaneRelatedProperties = ({ onClose, open, itemsPerPage }: Props) => {
  return (
    <LeftPaneTray title="Ownership Search" open={open} onClose={onClose}>
      <div className="flex flex-col grow">
        <OwnershipSearch itemsPerPage={itemsPerPage} />
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
            href="https://landexplorer.coop/land-ownership-how"
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

export default LeftPaneRelatedProperties;
