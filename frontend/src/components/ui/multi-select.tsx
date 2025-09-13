import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Option {
  value: string;
  label: string;
  avatar?: string;
  department?: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((option) => value.includes(option.value));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && event.target instanceof Node) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target)
        ) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative w-full">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between",
          className
        )}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <div className="flex flex-wrap gap-1 max-w-full">
          {selectedOptions.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.slice(0, 2).map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="h-6 px-2 text-xs"
                >
                  <div className="flex items-center gap-1">
                    {option.avatar && (
                      <img
                        src={option.avatar}
                        alt={option.label}
                        className="w-3 h-3 rounded-full"
                      />
                    )}
                    <span className="max-w-20 truncate">{option.label}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(option.value);
                      }}
                    />
                  </div>
                </Badge>
              ))}
              {selectedOptions.length > 2 && (
                <Badge variant="secondary" className="h-6 px-2 text-xs">
                  +{selectedOptions.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg"
          style={{ 
            maxHeight: '200px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No users available
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-b-0",
                  value.includes(option.value) && "bg-accent text-accent-foreground"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {option.avatar && (
                    <img
                      src={option.avatar}
                      alt={option.label}
                      className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{option.label}</span>
                    {option.department && (
                      <span className="text-xs text-muted-foreground truncate">
                        {option.department}
                      </span>
                    )}
                  </div>
                </div>
                {value.includes(option.value) && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
