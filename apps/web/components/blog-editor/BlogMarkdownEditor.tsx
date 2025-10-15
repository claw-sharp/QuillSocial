import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { useEffect, useState, useRef } from "react";
import { Button } from "@quillsocial/ui";
import {
  Eye,
  EyeOff,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  FileCode,
  Image as ImageIcon,
  Link as LinkIcon,
} from "@quillsocial/ui/components/icon";
import { AddImageDialog } from "../common/AddImageDialog";

// Convert Tiptap HTML back to markdown
function convertHTMLToMarkdown(html: string): string {
  let markdown = html;

  // Remove wrapping paragraph tags
  markdown = markdown.replace(/<\/?p[^>]*>/g, '\n\n');

  // Headers (add H4 support)
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');

  // Italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');
  });

  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${counter++}. $1\n`;
    });
  });

  // Code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');

  // Inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
  });

  // Images (must come before links)
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return markdown;
}

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BlogMarkdownEditor({ value, onChange, placeholder }: BlogMarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(value);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues in Next.js
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: false, // Changed to false for better layout control
        allowBase64: true,
        HTMLAttributes: {
          class: 'blog-editor-image',
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      // Get the text content and convert it to markdown representation
      const text = editor.getText();
      // For now, use HTML as fallback since tiptap-markdown storage might not be exposed
      const html = editor.getHTML();
      // Try to convert back to markdown-like format
      const markdown = convertHTMLToMarkdown(html);
      setMarkdownContent(markdown);
      onChange(markdown);
    },
  });

  // Update editor when external value changes
  useEffect(() => {
    if (editor && value !== markdownContent) {
      editor.commands.setContent(value);
      setMarkdownContent(value);
    }
  }, [value]);

  // Handle image insertion
  const handleImageInsert = async (imageSrc: string, cloudFileId?: number) => {
    if (editor && imageSrc) {
      // Insert image with default size (auto)
      editor.chain().focus().setImage({
        src: imageSrc,
        alt: 'Blog image',
      }).run();
      setShowImageDialog(false);
    }
  };

  // Helper function to set image size for selected image
  const setImageSize = (width: string) => {
    if (!editor) return;

    // Update the selected image node's attributes
    editor.chain().focus().updateAttributes('image', {
      style: `width: ${width}; height: auto;`
    }).run();
  };

  // Check if an image is currently selected
  const isImageSelected = editor?.isActive('image') ?? false;

  if (!editor) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        .blog-editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .blog-editor-image.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50 p-2 flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-slate-200" : ""}
          StartIcon={Heading1}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-slate-200" : ""}
          StartIcon={Heading2}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-slate-200 text-xs" : "text-xs"}
        >
          H3
        </Button>
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive("heading", { level: 4 }) ? "bg-slate-200 text-xs" : "text-xs"}
        >
          H4
        </Button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-slate-200 font-bold" : "font-bold"}
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-slate-200 italic" : "italic"}
        >
          I
        </Button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-slate-200" : ""}
          StartIcon={List}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-slate-200" : ""}
          StartIcon={ListOrdered}
        />
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-slate-200" : ""}
          StartIcon={Code}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-slate-200" : ""}
          StartIcon={Quote}
        />
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => setShowImageDialog(true)}
          StartIcon={ImageIcon}
          tooltip="Insert image"
        >
          Image
        </Button>

        {/* Image Size Controls - Only show when image is selected */}
        {isImageSelected && (
          <>
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <span className="text-xs text-gray-500 px-2">Size:</span>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('25%')}
              className="text-xs"
              tooltip="Small (25%)"
            >
              S
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('50%')}
              className="text-xs"
              tooltip="Medium (50%)"
            >
              M
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('75%')}
              className="text-xs"
              tooltip="Large (75%)"
            >
              L
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('100%')}
              className="text-xs"
              tooltip="Full Width (100%)"
            >
              Full
            </Button>
          </>
        )}
        <div className="ml-auto" />
        <Button
          type="button"
          size="sm"
          color={showCode ? "primary" : "secondary"}
          onClick={() => setShowCode(!showCode)}
          StartIcon={FileCode}
        >
          {showCode ? "Hide Code" : "View Code"}
        </Button>
        <Button
          type="button"
          size="sm"
          color={showPreview ? "primary" : "secondary"}
          onClick={() => setShowPreview(!showPreview)}
          StartIcon={showPreview ? EyeOff : Eye}
        >
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Editor, Preview, or Code View */}
      {showCode ? (
        <div className="p-6 min-h-[400px] overflow-auto bg-slate-50">
          <textarea
            value={markdownContent}
            onChange={(e) => {
              setMarkdownContent(e.target.value);
              editor?.commands.setContent(e.target.value);
            }}
            className="w-full h-[400px] p-4 font-mono text-sm bg-white border border-slate-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Markdown content..."
          />
        </div>
      ) : showPreview ? (
        <div className="p-6 min-h-[400px] overflow-auto bg-white">
          <div className="prose prose-slate max-w-none">
            {/* Render markdown preview */}
            <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(value) }} />
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="bg-white" />
      )}
    </div>

    {/* Image Upload Dialog */}
    <AddImageDialog
      open={showImageDialog}
      onClose={() => setShowImageDialog(false)}
      handleImageChange={handleImageInsert}
    />
  </>
  );
}

// Simple markdown to HTML renderer for preview
function renderMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers (H4, H3, H2, H1 - order matters!)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\_(.*?)\_/g, '<em>$1</em>');

  // Images (must come before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 p-4 rounded"><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>');

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-slate-300 pl-4 italic">$1</blockquote>');

  // Lists
  html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}
