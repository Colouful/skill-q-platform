"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { pixelSelectClassName } from "@/lib/pixel-form-classes";
import {
  composeRefs,
  dispatchFormControlValue,
  hasClearableValue,
  PixelClearButton,
  PixelSelectChevron,
  useClientMounted,
} from "./clearable-control";

export type PixelSelectProps = React.ComponentProps<"select"> & {
  clearable?: boolean;
  clearAriaLabel?: string;
  emptyLabel?: string;
  onClear?: () => void;
};

export const PixelSelect = React.forwardRef<HTMLSelectElement, PixelSelectProps>(
  (
    {
      children,
      className,
      clearable = false,
      clearAriaLabel = "清空选择",
      emptyLabel = "请选择",
      onChange,
      onClear,
      value,
      defaultValue,
      disabled,
      multiple,
      ...props
    },
    ref,
  ) => {
    const selectRef = React.useRef<HTMLSelectElement>(null);
    const mounted = useClientMounted();
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = React.useState(value ?? defaultValue ?? "");
    const currentValue = isControlled ? value : innerValue;
    const showClear =
      mounted && clearable && !disabled && !multiple && hasClearableValue(currentValue);
    const childOptions = React.Children.toArray(children);
    const hasEmptyOption = childOptions.some(
      (child) => React.isValidElement<{ value?: string }>(child) && child.props.value === "",
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (!isControlled) {
          setInnerValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange],
    );

    const handleClear = React.useCallback(() => {
      const control = selectRef.current;
      if (!control) return;
      dispatchFormControlValue(control, "", "change");
      if (!isControlled) {
        setInnerValue("");
      }
      onClear?.();
      control.focus();
    }, [isControlled, onClear]);

    const optionNodes = (
      <>
        {clearable && !multiple && !hasEmptyOption ? <option value="">{emptyLabel}</option> : null}
        {children}
      </>
    );

    if (!mounted) {
      return (
        <select
          ref={composeRefs(ref, selectRef)}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          multiple={multiple}
          onChange={handleChange}
          className={cn(pixelSelectClassName, className)}
          {...props}
        >
          {optionNodes}
        </select>
      );
    }

    return (
      <div className="relative w-full">
        <select
          ref={composeRefs(ref, selectRef)}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          multiple={multiple}
          onChange={handleChange}
          className={cn(pixelSelectClassName, "appearance-none pr-16", className)}
          {...props}
        >
          {optionNodes}
        </select>
        {showClear ? (
          <PixelClearButton
            aria-label={clearAriaLabel}
            className="top-1/2 right-8 -translate-y-1/2"
            onClick={handleClear}
          />
        ) : null}
        <PixelSelectChevron />
      </div>
    );
  },
);

PixelSelect.displayName = "PixelSelect";
