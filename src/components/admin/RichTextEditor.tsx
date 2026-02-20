import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bold, Italic, Underline, Link, Image, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Eye, Code, Heading1,
  Heading2, Heading3, Strikethrough, Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "1" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "X-Large", value: "7" },
];

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Only set innerHTML from outside when value changes externally (not from typing)
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    if (linkUrl) {
      execCommand("createLink", linkUrl);
      setLinkUrl("");
    }
  };

  const insertImageUrl = () => {
    if (imageUrl) {
      execCommand("insertImage", imageUrl);
      setImageUrl("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      execCommand("insertImage", reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );

  const iconSize = "h-3.5 w-3.5";

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
        {/* Font Family */}
        <select
          className="h-7 text-xs border border-input rounded px-1 bg-background mr-1"
          onChange={(e) => execCommand("fontName", e.target.value)}
          defaultValue=""
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font Size */}
        <select
          className="h-7 text-xs border border-input rounded px-1 bg-background mr-1"
          onChange={(e) => execCommand("fontSize", e.target.value)}
          defaultValue="3"
        >
          {FONT_SIZE_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => execCommand("bold")} title="Bold">
          <Bold className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("italic")} title="Italic">
          <Italic className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("underline")} title="Underline">
          <Underline className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("strikeThrough")} title="Strikethrough">
          <Strikethrough className={iconSize} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => execCommand("formatBlock", "<h1>")} title="Heading 1">
          <Heading1 className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("formatBlock", "<h2>")} title="Heading 2">
          <Heading2 className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("formatBlock", "<h3>")} title="Heading 3">
          <Heading3 className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("formatBlock", "<p>")} title="Paragraph">
          <Type className={iconSize} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => execCommand("justifyLeft")} title="Align Left">
          <AlignLeft className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("justifyCenter")} title="Align Center">
          <AlignCenter className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("justifyRight")} title="Align Right">
          <AlignRight className={iconSize} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
          <List className={iconSize} />
        </ToolButton>
        <ToolButton onClick={() => execCommand("insertOrderedList")} title="Numbered List">
          <ListOrdered className={iconSize} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Insert Link">
              <Link className={iconSize} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3">
            <div className="space-y-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={insertLink} className="w-full">Insert Link</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Insert Image">
              <Image className={iconSize} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3">
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full" onClick={() => imageInputRef.current?.click()}>
                Upload from device
              </Button>
              <div className="text-xs text-center text-muted-foreground">or</div>
              <Input
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={insertImageUrl} className="w-full">Insert URL</Button>
            </div>
          </PopoverContent>
        </Popover>

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => execCommand("formatBlock", "<pre>")} title="Code Block">
          <Code className={iconSize} />
        </ToolButton>

        {/* Preview Toggle */}
        <div className="ml-auto">
          <ToolButton onClick={() => setShowPreview(!showPreview)} active={showPreview} title="Preview">
            <Eye className={iconSize} />
          </ToolButton>
        </div>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground">No content yet</p>' }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 text-sm outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_a]:text-primary [&_a]:underline"
        />
      )}
    </div>
  );
};

export default RichTextEditor;
