import { useRef, useCallback, useEffect } from 'react';

export default function Field({
  tag: Tag = 'div',
  value,
  onChange,
  placeholder,
  html,
  multiline,
  className,
  style,
  ...rest
}) {
  const ref = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (!multiline || !ref.current) return;
    const el = ref.current;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [multiline, value]);

  if (html) {
    return (
      <Tag
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={() => {
          if (!ref.current) return;
          const next = ref.current.innerHTML;
          if (next !== value) onChange(next);
        }}
        onInput={() => {
          if (!ref.current) return;
          onChange(ref.current.innerHTML);
        }}
        data-placeholder={placeholder}
        className={`field${className ? ' ' + className : ''}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        {...rest}
      />
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={ref}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field${className ? ' ' + className : ''}`}
        style={{
          border: 'none',
          background: 'transparent',
          font: 'inherit',
          color: 'inherit',
          width: '100%',
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          display: 'block',
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          ...style,
        }}
        rows={1}
        {...rest}
      />
    );
  }

  // Default: contentEditable element — matches original behavior and CSS
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={() => {
        if (!ref.current) return;
        const next = ref.current.textContent;
        if (next !== value) onChange(next);
      }}
      onInput={() => {
        if (!ref.current) return;
        onChange(ref.current.textContent);
      }}
      data-placeholder={placeholder}
      className={`field${className ? ' ' + className : ''}`}
      style={style}
      {...rest}
    >
      {value || ''}
    </Tag>
  );
}