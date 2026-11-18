"use client";

import * as RSelect from "@radix-ui/react-select";
import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as RPointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { Icon, type IconName } from "./icon";
import { useIndicator } from "./use-indicator";

/* ---------------- shared field chrome ---------------- */

interface FieldBits {
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

function FieldLabel({ type, htmlFor, label, hideLabel, required }: { type: string; htmlFor: string } & FieldBits) {
  return (
    <label htmlFor={htmlFor} {...nPart(type, "label")} style={hideLabel ? srOnly : undefined}>
      {label}
      {!required ? <span {...nPart(type, "optional")}>Optional</span> : null}
    </label>
  );
}

function FieldMessage({ type, id, hint, error }: { type: string; id: string; hint?: ReactNode; error?: ReactNode }) {
  if (error) {
    return (
      <p id={id} role="alert" {...nPart(type, "error")}>
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} {...nPart(type, "hint")}>
      {hint}
    </p>
  ) : null;
}

export const srOnly: CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };

/* ---------------- Input ---------------- */

export interface InputProps extends NProps, FieldBits, Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  prefix?: ReactNode;
  suffix?: ReactNode;
  icon?: IconName;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "outline", size = "md", nid, label, hideLabel, hint, error, required, disabled, prefix, suffix, icon, id, className, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const msg = `${inputId}-msg`;
  return (
    <div {...nRoot("input", { variant, size, nid }, {}, { disabled, invalid: !!error })} className={className}>
      <FieldLabel type="input" htmlFor={inputId} label={label} hideLabel={hideLabel} required={required} />
      <div {...nPart("input", "control")}>
        {icon ? (
          <span {...nPart("input", "prefix")}>
            <Icon name={icon} />
          </span>
        ) : null}
        {prefix ? <span {...nPart("input", "prefix")}>{prefix}</span> : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msg : undefined}
          {...nPart("input", "input")}
          {...rest}
        />
        {suffix ? <span {...nPart("input", "suffix")}>{suffix}</span> : null}
      </div>
      <FieldMessage type="input" id={msg} hint={hint} error={error} />
    </div>
  );
});

/* ---------------- Textarea ---------------- */

export interface TextareaProps extends NProps, FieldBits, TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

export function Textarea({ variant = "outline", size, nid, label, hideLabel, hint, error, required, disabled, id, showCount, maxLength, value, defaultValue, onChange, ...rest }: TextareaProps) {
  const auto = useId();
  const tid = id ?? auto;
  const [count, setCount] = useState(String(value ?? defaultValue ?? "").length);
  return (
    <div {...nRoot("textarea", { variant, size, nid }, {}, { disabled, invalid: !!error })}>
      <FieldLabel type="textarea" htmlFor={tid} label={label} hideLabel={hideLabel} required={required} />
      <textarea
        id={tid}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${tid}-msg` : undefined}
        onChange={(e) => {
          setCount(e.target.value.length);
          onChange?.(e);
        }}
        {...nPart("textarea", "control")}
        {...rest}
      />
      {showCount ? (
        <span {...nPart("textarea", "counter")} aria-live="polite">
          {count}
          {maxLength ? ` / ${maxLength}` : ""}
        </span>
      ) : null}
      <FieldMessage type="textarea" id={`${tid}-msg`} hint={hint} error={error} />
    </div>
  );
}

/* ---------------- Select (Radix) ---------------- */

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends NProps, FieldBits {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ variant = "outline", size = "md", nid, label, hideLabel, hint, error, required, options, value, defaultValue, onValueChange, placeholder = "Choose…", disabled }: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div {...nRoot("select", { variant, size, nid }, {}, { disabled, invalid: !!error, open })}>
      <FieldLabel type="select" htmlFor={id} label={label} hideLabel={hideLabel} required={required} />
      <RSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} required={required} open={open} onOpenChange={setOpen}>
        <RSelect.Trigger id={id} aria-invalid={error ? true : undefined} {...nPart("select", "trigger")}>
          <span {...nPart("select", "value")}>
            <RSelect.Value placeholder={placeholder} />
          </span>
          <RSelect.Icon asChild>
            <span {...nPart("select", "icon")} style={{ display: "inline-flex" }}>
              <Icon name="chevron-down" />
            </span>
          </RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content position="popper" sideOffset={6} {...nRoot("select", { variant, size, nid: nid ? `${nid}-popup` : undefined })}>
            <div {...nPart("select", "content")}>
              <RSelect.Viewport {...nPart("select", "viewport")}>
                {options.map((o) => (
                  <RSelect.Item key={o.value} value={o.value} disabled={o.disabled} {...nPart("select", "item")}>
                    <RSelect.ItemText>{o.label}</RSelect.ItemText>
                    <RSelect.ItemIndicator {...nPart("select", "indicator")}>
                      <Icon name="check" />
                    </RSelect.ItemIndicator>
                  </RSelect.Item>
                ))}
              </RSelect.Viewport>
            </div>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
      <FieldMessage type="select" id={`${id}-msg`} hint={hint} error={error} />
    </div>
  );
}

/* ---------------- Combobox ---------------- */

export interface ComboboxProps extends NProps, FieldBits {
  options: string[];
  value?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
}

export function Combobox({ variant = "outline", nid, label, hideLabel, hint, error, required, options, value, onValueChange, placeholder }: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const filtered = useMemo(() => options.filter((o) => o.toLowerCase().includes(query.toLowerCase())), [options, query]);

  const choose = (o: string) => {
    setQuery(o);
    onValueChange?.(o);
    setOpen(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && filtered[active]) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div {...nRoot("combobox", { variant, nid }, {}, { open, invalid: !!error })} style={{ position: "relative" }}>
      <FieldLabel type="combobox" htmlFor={id} label={label} hideLabel={hideLabel} required={required} />
      <div {...nPart("combobox", "control")}>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-o${active}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          {...nPart("combobox", "input")}
        />
        <Icon name="chevrons-up-down" {...nPart("combobox", "icon")} />
      </div>
      {open ? (
        <ul id={listId} role="listbox" aria-label={label} {...nPart("combobox", "list")}>
          {filtered.length === 0 ? <li {...nPart("combobox", "empty")}>No matches</li> : null}
          {filtered.map((o, i) => (
            <li
              key={o}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === active}
              {...nPart("combobox", "option", { selected: i === active, current: o === value })}
              onPointerMove={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      ) : null}
      <FieldMessage type="combobox" id={`${id}-msg`} hint={hint} error={error} />
    </div>
  );
}

/* ---------------- Checkbox ---------------- */

export interface CheckboxProps extends NProps, Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: ReactNode;
  description?: ReactNode;
  error?: boolean;
}

export function Checkbox({ variant = "default", size = "md", nid, label, description, checked, defaultChecked, onChange, disabled, error, id, ...rest }: CheckboxProps) {
  const auto = useId();
  const cid = id ?? auto;
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  return (
    <label htmlFor={cid} {...nRoot("checkbox", { variant, size, nid }, {}, { selected: on, disabled, invalid: error })}>
      <input
        id={cid}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => {
          if (checked === undefined) setInner(e.target.checked);
          onChange?.(e);
        }}
        {...nPart("checkbox", "input")}
        {...rest}
      />
      <span {...nPart("checkbox", "box")} aria-hidden>
        <Icon name="check" {...nPart("checkbox", "indicator")} />
      </span>
      <span>
        <span {...nPart("checkbox", "label")}>{label}</span>
        {description ? <span {...nPart("checkbox", "description")}>{description}</span> : null}
      </span>
    </label>
  );
}

/* ---------------- Radio group ---------------- */

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends NProps {
  legend: string;
  hideLegend?: boolean;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
}

export function RadioGroup({ variant = "default", nid, legend, hideLegend, options, value, defaultValue, onValueChange }: RadioGroupProps) {
  const name = useId();
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const cur = value ?? inner;
  return (
    <fieldset {...nRoot("radio", { variant, nid })}>
      <legend {...nPart("radio", "legend")} style={hideLegend ? srOnly : undefined}>
        {legend}
      </legend>
      {options.map((o) => {
        const sel = o.value === cur;
        const s = { selected: sel, disabled: o.disabled };
        return (
          <label key={o.value} {...nPart("radio", "item", s)}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={sel}
              disabled={o.disabled}
              onChange={() => {
                if (value === undefined) setInner(o.value);
                onValueChange?.(o.value);
              }}
              {...nPart("radio", "input")}
            />
            <span {...nPart("radio", "circle", s)} aria-hidden>
              <span {...nPart("radio", "dot", s)} />
            </span>
            <span>
              <span {...nPart("radio", "label")}>{o.label}</span>
              {o.description ? <span {...nPart("radio", "description")}>{o.description}</span> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/* ---------------- Switch ---------------- */

export interface SwitchProps extends NProps {
  label?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}

/** Switch — role="switch". Hardware I/O marks mean state never depends on colour alone. */
export function Switch({ variant = "marks", size = "md", nid, label, description, checked, defaultChecked, onCheckedChange, disabled, id, ...aria }: SwitchProps) {
  const auto = useId();
  const sid = id ?? auto;
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (checked === undefined) setInner(!on);
    onCheckedChange?.(!on);
  };
  const control = (
    <button
      id={sid}
      type="button"
      role="switch"
      aria-checked={on}
      aria-describedby={description ? `${sid}-d` : undefined}
      disabled={disabled}
      onClick={toggle}
      {...nPart("switch", "track")}
      {...aria}
    >
      <span {...nPart("switch", "mark")} aria-hidden>
        {on ? "I" : "O"}
      </span>
      <span {...nPart("switch", "thumb")} aria-hidden />
    </button>
  );
  return (
    <div {...nRoot("switch", { variant, size, nid }, {}, { selected: on, disabled })}>
      {label ? (
        <span {...nPart("switch", "text")}>
          <label htmlFor={sid} {...nPart("switch", "label")}>
            {label}
          </label>
          {description ? (
            <span id={`${sid}-d`} {...nPart("switch", "description")}>
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
      {control}
    </div>
  );
}

/* ---------------- Slider ---------------- */

export interface SliderProps extends NProps {
  label: string;
  hideLabel?: boolean;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (v: number) => void;
  format?: (v: number) => string;
  ticks?: number;
  disabled?: boolean;
}

/** Slider — role="slider"; ←/→/↑/↓ step, PageUp/PageDown ×10, Home/End. Pointer drag on the track. */
export function Slider({ variant = "default", nid, label, hideLabel, value, defaultValue, min = 0, max = 100, step = 1, onValueChange, format = String, ticks = 0, disabled }: SliderProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue ?? min);
  const [drag, setDrag] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const cur = value ?? inner;
  const pct = ((cur - min) / (max - min)) * 100;

  const set = (v: number) => {
    const snapped = Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
    const fixed = +snapped.toFixed(4);
    if (value === undefined) setInner(fixed);
    onValueChange?.(fixed);
  };
  const fromPointer = (e: RPointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    set(min + ((e.clientX - r.left) / r.width) * (max - min));
  };
  const onKey = (e: KeyboardEvent) => {
    const big = (max - min) / 10;
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
    if (e.key in map) set(cur + map[e.key]);
    else if (e.key === "Home") set(min);
    else if (e.key === "End") set(max);
    else return;
    e.preventDefault();
  };

  return (
    <div {...nRoot("slider", { variant, nid }, {}, { disabled, dragging: drag })} style={{ "--n-pct": `${pct}%` } as CSSProperties}>
      <div {...nPart("slider", "header")} style={hideLabel ? srOnly : undefined}>
        <span id={`${id}-l`} {...nPart("slider", "label")}>
          {label}
        </span>
        <output {...nPart("slider", "value")} aria-hidden>
          {format(cur)}
        </output>
      </div>
      <div
        ref={track}
        {...nPart("slider", "track")}
        onPointerDown={(e) => {
          if (disabled) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setDrag(true);
          fromPointer(e);
        }}
        onPointerMove={(e) => drag && fromPointer(e)}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
      >
        <div {...nPart("slider", "fill")} />
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={`${id}-l`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={cur}
          aria-valuetext={format(cur)}
          aria-disabled={disabled || undefined}
          onKeyDown={onKey}
          {...nPart("slider", "thumb")}
        />
      </div>
      {ticks > 1 ? (
        <div {...nPart("slider", "ticks")} aria-hidden>
          {Array.from({ length: ticks }, (_, i) => (
            <span key={i} {...nPart("slider", "tick")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Segmented control ---------------- */

export interface SegmentedProps<T extends string> extends NProps {
  label: string;
  options: ReadonlyArray<{ value: T; label: ReactNode; disabled?: boolean }>;
  value?: T;
  defaultValue?: T;
  onValueChange?: (v: T) => void;
  block?: boolean;
}

export function SegmentedControl<T extends string>({ variant = "default", size = "md", nid, label, options, value, defaultValue, onValueChange, block }: SegmentedProps<T>) {
  const name = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const cur = value ?? inner;
  const ind = useIndicator(ref, "[data-selected]", [cur, options.length]);
  return (
    <div ref={ref} role="radiogroup" aria-label={label} {...nRoot("segmented", { variant, size, nid })} style={block ? { display: "flex", width: "100%" } : undefined}>
      <span {...nPart("segmented", "thumb")} style={ind} aria-hidden />
      {options.map((o) => {
        const sel = o.value === cur;
        return (
          <label key={o.value} {...nPart("segmented", "item", { selected: sel, disabled: o.disabled })}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={sel}
              disabled={o.disabled}
              onChange={() => {
                if (value === undefined) setInner(o.value);
                onValueChange?.(o.value);
              }}
              {...nPart("segmented", "input")}
            />
            <span {...nPart("segmented", "label")}>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
