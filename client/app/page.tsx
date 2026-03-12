'use client';
import * as React from 'react';
import ChatComponent from "./components/chat";
import FileUploadComponent from "./components/file-upload";

export default function Home() {
  const [activeCollection, setActiveCollection] = React.useState<string | null>(null);

  return (
    <div className="flex-1 w-full min-h-screen flex overflow-hidden">
      <div className="w-[25vw]">
        <FileUploadComponent onUpload={(collection) => setActiveCollection(collection)} />
      </div>
      <div className="w-[75vw] border-l">
        <ChatComponent collection={activeCollection} />
      </div>
    </div>
  );
}
