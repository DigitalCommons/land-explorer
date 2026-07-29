import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import * as turf from "@turf/turf";
import {
  clearHighlightedProperties,
  highlightProperties,
} from "../../actions/LandOwnershipActions";
import { setLngLat, setZoom } from "../../actions/MapActions";
import { Button } from "../ui/button";
import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import iconArrowGrey from "@/assets/img/icon-arrow-grey.svg";
import iconArrowGreen from "@/assets/img/icon-arrow-green.svg";

const RelatedProperty = ({ property }: { property: any }) => {
  const dispatch = useAppDispatch();
  const highlighted = useAppSelector((state) =>
    state.landOwnership.highlightedProperties.hasOwnProperty(property.title_no),
  );

  const center = turf.pointOnFeature(property.polygons[0].geom).geometry
    .coordinates;
  const lng = center[0];
  const lat = center[1];

  const handlePropertyClick = () => {
    if (highlighted) {
      dispatch(clearHighlightedProperties([property.title_no]));
    } else {
      dispatch(highlightProperties({ [property.title_no]: property }));
    }
  };

  const gotoProperty = () => {
    dispatch(setLngLat(lng, lat));
    dispatch(setZoom([17]));
    dispatch(highlightProperties({ [property.title_no]: property }));
  };

  return (
    <div className="flex gap-2" key={property.title_no}>
      <PropertyIcon
        className="pt-1"
        active={highlighted}
        handleClick={handlePropertyClick}
      />
      <div
        className="grow gap-2 text-sm cursor-pointer"
        onClick={handlePropertyClick}
      >
        <PropertyAddress
          active={highlighted}
          address={property.property_address}
        />
        <div>Title no: {property.title_no}</div>
      </div>
      <Button
        size="icon-lg"
        variant="ghost"
        aria-label="move map to property icon"
        title="Go to Property"
        className="justify-end"
        onClick={gotoProperty}
      >
        <IconArrow />
      </Button>
    </div>
  );
};

export default RelatedProperty;

type PropertyIconProps = {
  active: boolean;
  handleClick: () => void;
  className: string;
} & PropsWithChildren;

const PropertyIcon = ({
  active,
  handleClick,
  className,
}: PropertyIconProps) => {
  const iconColor = active
    ? "fill-primary cursor-default"
    : "fill-gray-300 cursor-pointer";
  return (
    <i className={cn(iconColor, className)} onClick={handleClick}>
      <svg
        className="size-4.5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 12.6 18"
      >
        <path
          d="M13.8,3A6.3,6.3,0,0,0,7.5,9.3c0,4.725,6.3,11.7,6.3,11.7s6.3-6.975,6.3-11.7A6.3,6.3,0,0,0,13.8,3Zm0,8.55A2.25,2.25,0,1,1,16.05,9.3,2.251,2.251,0,0,1,13.8,11.55Z"
          transform="translate(-7.5 -3)"
        />
      </svg>
    </i>
  );
};

type PropertyAddressProps = {
  active: boolean;
  address: string;
};

const PropertyAddress = ({ active, address }: PropertyAddressProps) => {
  if (active) {
    return <div className="text-primary cursor-default">{address}</div>;
  }
  return <div className="cursor-pointer">{address}</div>;
};

const IconArrow = () => {
  return (
    <span className="relative block size-4.5">
      <img
        src={iconArrowGrey}
        alt=""
        className="absolute inset-0 size-4.5 group-hover/button:opacity-0"
      />
      <img
        src={iconArrowGreen}
        alt=""
        className="absolute inset-0 size-4.5 opacity-0 group-hover/button:opacity-100"
      />
    </span>
  );
};
