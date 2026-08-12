import { fetchPropertyOwnerships } from "@/actions/LandOwnershipActions";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { useCallback, useEffect, useState } from "react";

const OwnershipYear = () => {
  const dispatch = useAppDispatch();
  const proprietorName = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesProprietorName,
  );
  const selectedYear = useAppSelector(
    (state) => state.landOwnership.relatedPropertiesYear,
  );
  const minimumYear = 2017;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  // This is an immediately updated copy of the slider value so dragging feels responsive
  // and the labels update immediately instead of after the user has stopped dragging
  const [displayYear, setDisplayYear] = useState(selectedYear);
  useEffect(() => {
    setDisplayYear(selectedYear);
  }, [selectedYear]);

  const label =
    displayYear === currentYear
      ? `Viewing current ownership as of ${currentMonth} ${currentYear}`
      : `Viewing properties owned in December ${displayYear}`;

  const commitYearChange = useCallback(
    (year: number) => {
      dispatch({ type: "SET_RELATED_PROPERTIES_YEAR", payload: year });

      if (proprietorName !== null) {
        dispatch(fetchPropertyOwnerships(year, currentYear, proprietorName));
      }
    },
    [currentYear, dispatch, proprietorName],
  );

  return (
    <div className="flex flex-col gap-3 mt-2 mx-4">
      <div className="text-primary">{label}</div>
      <Label htmlFor="slider-ownership-year">Ownership Year</Label>
      <Slider
        id="slider-ownership-year"
        value={[displayYear]}
        max={currentYear}
        min={minimumYear}
        step={1}
        tooltipContent={`${displayYear}`}
        onValueChange={(value) =>
          setDisplayYear(Array.isArray(value) ? value[0] : value)
        }
        onValueCommitted={(value) =>
          commitYearChange(Array.isArray(value) ? value[0] : value)
        }
      />
      <div className="flex justify-between text-sm">
        <div>{minimumYear}</div>
        <div>{currentYear}</div>
      </div>
    </div>
  );
};

export default OwnershipYear;
