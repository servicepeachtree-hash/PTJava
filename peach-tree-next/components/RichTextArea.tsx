'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

export default function RichTextArea({
  value, onChange,
}: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'rte-content' },
    },
    immediatelyRender: false,
  });

  // Keep editor in sync if `value` is set externally (e.g. loading an existing product)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  function setLink() {
    const url = window.prompt('Link URL', 'https://');
    if (!url) return;
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  const btn = (active: boolean) => `rte-btn${active ? ' active' : ''}`;

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <button type="button" className={btn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="rte-divider" />
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
        <button type="button" className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
        <span className="rte-divider" />
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <span className="rte-divider" />
        <button type="button" className={btn(editor.isActive('link'))} onClick={setLink}>🔗 Link</button>
        <button type="button" className="rte-btn" onClick={() => editor.chain().focus().undo().run()}>↺</button>
        <button type="button" className="rte-btn" onClick={() => editor.chain().focus().redo().run()}>↻</button>
      </div>
      <EditorContent editor={editor} className="rte-editor" />
    </div>
  );
}
