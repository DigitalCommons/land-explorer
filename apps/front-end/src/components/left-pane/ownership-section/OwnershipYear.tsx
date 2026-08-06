import { fetchPropertyOwnerships } from "@/actions/LandOwnershipActions";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

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

  // This is an immediately-updated copy of the slider value so dragging feels responsive. Because of
  // the debounce, the Redux value for the year and the properties fetch are only updated once dragging of the slider stops.
  // This is to avoid dispatching to Redux on every drag tick which re-renders unrelated components (e.g. the map) and makes the slider laggy
  const [displayYear, setDisplayYear] = useState(selectedYear);
  useEffect(() => {
    setDisplayYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    dispatch({ type: "SET_RELATED_PROPERTIES_YEAR", payload: currentYear });
  }, [proprietorName]);

  const label =
    displayYear === currentYear
      ? `Viewing current ownership as of ${currentMonth} ${currentYear}`
      : `Viewing properties owned in December ${displayYear}`;

  const abortControllerRef = useRef<AbortController | null>(null);

  const yearChangeCallback = useCallback(
    (year: number) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch({ type: "SET_RELATED_PROPERTIES_YEAR", payload: year });

      if (proprietorName !== null) {
        dispatch(
          fetchPropertyOwnerships(
            year,
            currentYear,
            proprietorName,
            controller.signal,
          ),
        );
      }
    },
    [currentYear, dispatch, proprietorName],
  );

  const dispatchYearChange = useDebounceCallback(yearChangeCallback, 400);

  //abort any inflight requests and cancel any debounced calls when component unmounted or the proprietor/year is changed
  useEffect(() => {
    return () => {
      dispatchYearChange.cancel();
      abortControllerRef.current?.abort();
    };
  }, [dispatchYearChange]);

  const onYearChange = (value: number) => {
    setDisplayYear(value);
    dispatchYearChange(value);
  };

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
          onYearChange(Array.isArray(value) ? value[0] : value)
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
