'use client';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  codeBlockPlugin,
  linkDialogPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  InsertThematicBreak,
  Separator,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * Actual MDXEditor implementation with toolbar.
 * Dynamically imported by MDXEditorWrapper to avoid SSR.
 */
export default function MDXEditorImpl({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<MDXEditorMethods>(null);

  return (
    <div className="w-full rounded-xl border border-gray-300 bg-white">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        className="min-h-[300px]"
        contentEditableClassName="prose prose-sm max-w-none px-4 py-3 min-h-[300px] outline-none focus:outline-none"
        placeholder={placeholder ?? 'Start writing your story...'}
        suppressHtmlProcessing
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2">
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <InsertThematicBreak />
              </div>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
        ]}
      />
    </div>
  );
}
