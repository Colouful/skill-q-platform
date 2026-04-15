"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { pixelFormControlClassName } from "@/lib/pixel-form-classes";
import {
  composeRefs,
  dispatchFormControlValue,
  hasClearableValue,
  PixelClearButton,
  useClientMounted,
} from "./clearable-control";

/** 14.6 像素风格多行输入 */
export type PixelTextareaProps = React.ComponentProps<typeof Textarea> & {
  clearable?: boolean;
  clearAriaLabel?: string;
  onClear?: () => void;
};

export const PixelTextarea = React.forwardRef<HTMLTextAreaElement, PixelTextareaProps>(
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
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const mounted = useClientMounted();
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = React.useState(value ?? defaultValue ?? "");
    const currentValue = isControlled ? value : innerValue;
    const showClear =
      mounted && clearable && !disabled && !readOnly && hasClearableValue(currentValue);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isControlled) {
          setInnerValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange],
    );

    const handleClear = React.useCallback(() => {
      const control = textareaRef.current;
      if (!control) return;
      dispatchFormControlValue(control, "", "input");
      if (!isControlled) {
        setInnerValue("");
      }
      onClear?.();
      control.focus();
    }, [isControlled, onClear]);

    const textareaNode = (
      <Textarea
        ref={composeRefs(ref, textareaRef)}
        className={cn(
          pixelFormControlClassName,
          "min-h-20",
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
      return textareaNode;
    }

    return (
      <div className="relative w-full">
        {textareaNode}
        {showClear ? (
          <PixelClearButton aria-label={clearAriaLabel} className="top-2" onClick={handleClear} />
        ) : null}
      </div>
    );
  },
);

PixelTextarea.displayName = "PixelTextarea";
