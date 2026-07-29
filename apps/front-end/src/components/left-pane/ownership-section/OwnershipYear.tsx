import {
  fetchPropertyOwnershipByYear,
  fetchRelatedProperties,
} from "@/actions/LandOwnershipActions";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppDispatch, useAppSelector } from "@/hooks/react-redux";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

type OwnershipYearProps = {
  proprietorName: string;
};

const OwnershipYear = ({ proprietorName }: OwnershipYearProps) => {
  const dispatch = useAppDispatch();

  const minimumYear = 2017;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const label =
    selectedYear === currentYear
      ? `Viewing current ownership as of ${currentMonth} ${currentYear}`
      : `Viewing properties owned in December ${selectedYear}`;

  const abortControllerRef = useRef<AbortController | null>(null);

  const yearChangeCallback = useCallback(
    (year: number) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (year === currentYear) {
        dispatch(fetchRelatedProperties(proprietorName, controller.signal));
      } else {
        dispatch(
          fetchPropertyOwnershipByYear(
            year,
            proprietorName,
            undefined,
            controller.signal,
          ),
        );
      }
    },
    [currentYear, dispatch, proprietorName],
  );

  const dispatchYearChange = useDebounceCallback(yearChangeCallback, 400);

  useEffect(
    () => () => {
      dispatchYearChange.cancel();
      abortControllerRef.current?.abort();
    },
    [dispatchYearChange],
  );

  const onYearChange = (value: number) => {
    setSelectedYear(value);
    dispatchYearChange(value);
  };

  return (
    <div className="flex flex-col gap-3 mt-2 mx-4">
      <div className="text-primary">{label}</div>
      <Label htmlFor="slider-ownership-year">Ownership Year</Label>
      <Slider
        id="slider-ownership-year"
        value={[selectedYear]}
        max={currentYear}
        min={minimumYear}
        step={1}
        tooltipContent={`${selectedYear}`}
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
