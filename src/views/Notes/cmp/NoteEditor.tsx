import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import styles from './NoteModal.module.css';

interface Props {
  initialValue: string;
  onChange: (value: string) => void;
}

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  icon: string;
  title: string;
  onClick: () => void;
}

const ToolbarButton = ({ active = false, disabled = false, icon, title, onClick }: ToolbarButtonProps) => (
  <button
    type="button"
    className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
  </button>
);

const NoteEditor = ({ initialValue, onChange }: Props) => {
  const editor = useEditor({
    immediatelyRender: false,
    content: initialValue,
    contentType: 'markdown',
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      Placeholder.configure({
        placeholder: 'Scrivi in Markdown o testo normale…',
      }),
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.focus('end');
  }, [editor]);

  const toggleLink = () => {
    if (!editor) return;

    const activeHref = editor.getAttributes('link').href as string | undefined;
    const nextHref = window.prompt('Inserisci il link', activeHref ?? 'https://');

    if (nextHref === null) return;

    if (!nextHref.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: nextHref.trim() }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.editorWrap}>
      <div className={styles.toolbarRow}>
        <ToolbarButton
          icon="format_h1"
          title="Titolo"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon="format_h2"
          title="Sottotitolo"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon="format_bold"
          title="Grassetto"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon="format_italic"
          title="Corsivo"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon="format_underlined"
          title="Sottolineato"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon="format_list_bulleted"
          title="Lista puntata"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon="format_list_numbered"
          title="Lista numerata"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon="format_quote"
          title="Citazione"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon="code_blocks"
          title="Blocco codice"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolbarButton
          icon="link"
          title="Link"
          active={editor.isActive('link')}
          onClick={toggleLink}
        />
        <ToolbarButton
          icon="format_clear"
          title="Pulisci formato"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
      </div>

      <div className={styles.editorSurface}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NoteEditor;
