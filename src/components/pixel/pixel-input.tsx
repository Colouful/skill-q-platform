"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { pixelFormControlClassName } from "@/lib/pixel-form-classes";
import {
  composeRefs,
  dispatchFormControlValue,
  hasClearableValue,
  PixelClearButton,
  useClientMounted,
} from "./clearable-control";

/** 14.6 像素风格单行输入 */
export type PixelInputProps = React.ComponentProps<typeof Input> & {
  clearable?: boolean;
  clearAriaLabel?: string;
  onClear?: () => void;
};

export const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  (
    {
      className,
      clearable = false,
      clearAriaLabel = "清空输入",
      onChange,
      onClear,
      value,
      defaultValue,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const mounted = useClientMounted();
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = React.useState(value ?? defaultValue ?? "");
    const currentValue = isControlled ? value : innerValue;
    const showClear =
      mounted && clearable && !disabled && !readOnly && hasClearableValue(currentValue);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
          setInnerValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange],
    );

    const handleClear = React.useCallback(() => {
      const control = inputRef.current;
      if (!control) return;
      dispatchFormControlValue(control, "", "input");
      if (!isControlled) {
        setInnerValue("");
      }
      onClear?.();
      control.focus();
    }, [isControlled, onClear]);

    const inputNode = (
      <Input
        ref={composeRefs(ref, inputRef)}
        className={cn(
          pixelFormControlClassName,
          mounted && clearable ? "pr-10" : null,
          className,
        )}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        {...props}
      />
    );

    if (!mounted) {
      return inputNode;
    }

    return (
      <div className="relative w-full">
        {inputNode}
        {showClear ? (
          <PixelClearButton
            aria-label={clearAriaLabel}
            className="top-1/2 -translate-y-1/2"
            onClick={handleClear}
          />
        ) : null}
      </div>
    );
  },
);

PixelInput.displayName = "PixelInput";
