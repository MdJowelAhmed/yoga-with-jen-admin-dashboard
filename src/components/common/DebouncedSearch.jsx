import React, { useEffect, useRef, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

/**
 * Reusable debounced search input.
 * Calls `onChange` with the debounced trimmed value (default 400ms).
 */
const DebouncedSearch = ({
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Search...",
  delay = 400,
  allowClear = true,
  className = "",
  style = { width: 280, height: 45 },
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(
    controlledValue ?? defaultValue
  );
  const isFirstRender = useRef(true);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== inputValue) {
      setInputValue(controlledValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const nextValue =
        typeof inputValue === "string" ? inputValue.trim() : inputValue;
      onChangeRef.current?.(nextValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, delay]);

  return (
    <Input
      allowClear={allowClear}
      prefix={<SearchOutlined className="text-gray-400" />}
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className={className}
      style={style}
      {...rest}
    />
  );
};

export default DebouncedSearch;
