import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ id, value, onChange, placeholder = "Type something...", className, minHeight = "80px" }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const emojiCategories = {
      faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙃', '😉', '😌','😍','😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
      emotions: ['😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '�', '😓', '🤗', '🤔', '🤭'],
      gestures: ['👍','👎', '�', '✊', '🤛', '🤜', '�👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️'],
      hearts: ['❤️', '🧡', '�', '💚', '�', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '�', '💖', '💘', '💝', '💟', '♥️', '💋', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '💭'],
      symbols: ['🔥','⭐', '✨', '🌟', '💫', '⚡', '☄️', '💥', '🔔', '🔕', '📢', '📣', '💬', '💭', '🗯️', '♨️', '�', '�💯', '💢', '💥', '💫', '💦', '�', '☀️', '⭐', '✨', '🌙', '☁️', '⛅', '⛈️', '🌤️'],
      objects: ['💡', '🔦', '🏮', '📱', '💻', '⌨️', '🖥️', '🖨️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '⏲️', '⏱️', '⏳', '�'],
      work: ['📝', '📄', '📃', '📑', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '�️', '⚔️', '🔫'],
      status: ['✅', '❌', '❎', '✔️', '☑️', '⚠️', '🚫', '❗', '❓', '❕', '❔', '‼️', '⁉️', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '�', '🔘'],
      food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥒','🥕', '🥔', '🍠', '🥐', '🥖', '🥨', '🧀', '🥚'],
    };

    const allEmojis = Object.values(emojiCategories).flat();

    React.useEffect(() => {
      if (editorRef.current && !isInitialized) {
        editorRef.current.innerHTML = value || '';
        setIsInitialized(true);
      }
    }, [value, isInitialized]);

    const executeCommand = useCallback((command: string, value?: string) => {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
        const content = editorRef.current.innerHTML;
        onChange(content);
        setTimeout(() => {
          setBoldActive(isCommandActive('bold'));
          setItalicActive(isCommandActive('italic'));
          setUnderlineActive(isCommandActive('underline'));
        }, 0);
      }
    }, [onChange]);

    const handleInput = useCallback(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        onChange(content);
        setBoldActive(isCommandActive('bold'));
        setItalicActive(isCommandActive('italic'));
        setUnderlineActive(isCommandActive('underline'));
      }
    }, [onChange]);

    const insertEmoji = useCallback((emoji: string) => {
      if (editorRef.current) {
        editorRef.current.focus();
        
        const selection = window.getSelection();
        let range;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        
        const emojiNode = document.createTextNode(emoji);
        range.deleteContents();
        range.insertNode(emojiNode);
        
        range.setStartAfter(emojiNode);
        range.setEndAfter(emojiNode);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        const content = editorRef.current.innerHTML;
        onChange(content);
        setShowEmojiPicker(false);
      }
    }, [onChange]);

    const handleFocus = () => {
      setIsFocused(true);
      if (editorRef.current && (!value || value.trim() === '')) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      // Update button states when focused
      setTimeout(() => {
        setBoldActive(isCommandActive('bold'));
        setItalicActive(isCommandActive('italic'));
        setUnderlineActive(isCommandActive('underline'));
      }, 0);
    };

    const handleBlur = () => setIsFocused(false);

    const getPlainText = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    const isCommandActive = (command: string) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };

    const [boldActive, setBoldActive] = useState(false);
    const [italicActive, setItalicActive] = useState(false);
    const [underlineActive, setUnderlineActive] = useState(false);

    const handleSelectionChange = useCallback(() => {
      if (editorRef.current && document.activeElement === editorRef.current) {
        setBoldActive(isCommandActive('bold'));
        setItalicActive(isCommandActive('italic'));
        setUnderlineActive(isCommandActive('underline'));
      }
    }, []);

    React.useEffect(() => {
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [handleSelectionChange]);

    const saveCursorPosition = useCallback(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        return selection.getRangeAt(0);
      }
      return null;
    }, []);

    const restoreCursorPosition = useCallback((range: Range | null) => {
      if (range) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, []);

    React.useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
        const savedRange = saveCursorPosition();
        editorRef.current.innerHTML = value;
        if (isFocused) {
          restoreCursorPosition(savedRange);
        }
      }
    }, [value, saveCursorPosition, restoreCursorPosition, isFocused]);

    const showPlaceholder = !value || getPlainText(value).trim() === '';

    return (
      <div className={cn("border rounded-md overflow-hidden max-w-full", className)}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
          <Button
            type="button"
            variant={boldActive ? "default" : "ghost"}
            size="sm"
            onClick={() => executeCommand('bold')}
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()} 
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={italicActive ? "default" : "ghost"}
            size="sm"
            onClick={() => executeCommand('italic')}
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()} 
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={underlineActive ? "default" : "ghost"}
            size="sm"
            onClick={() => executeCommand('underline')}
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()} 
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          {/* Separator */}
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mb-4" align="start">
              <div className="flex flex-col max-h-96">
                <div 
                  className="h-80 overflow-y-auto p-3 bg-background scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground"
                  style={{ 
                    scrollBehavior: 'smooth',
                    overscrollBehavior: 'contain'
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="grid grid-cols-10 gap-1 pb-2">
                    {allEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-7 h-7 flex items-center justify-center text-base hover:bg-muted rounded-sm transition-colors duration-150 flex-shrink-0"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            id={id}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full p-3 text-sm bg-background focus:outline-none break-words overflow-wrap-anywhere whitespace-pre-wrap",
              showPlaceholder && !isFocused && "text-transparent"
            )}
            style={{ 
              minHeight,
              caretColor: '#000000',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              maxWidth: '100%'
            }}
          />
          
          {/* Placeholder */}
          {showPlaceholder && !isFocused && (
            <div 
              className="absolute top-3 left-3 text-sm text-muted-foreground pointer-events-none"
              style={{ minHeight }}
            >
              {placeholder}
            </div>
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
