'use client';
import { UserButton } from "@clerk/nextjs";
import { Upload, X } from "lucide-react";
import * as React from 'react'

interface UploadedFile {
    name: string;
    size: number;
    collection: string;
}

interface Props {
    onUpload: (collectionName: string) => void;
}

const FileUploadComponent: React.FC<Props> = ({ onUpload }) => {

    const [files, setFiles] = React.useState<UploadedFile[]>([]);

    const handleUploadButtonClick = () => {
        const el = document.createElement('input');
        el.setAttribute('type', 'file');
        el.setAttribute('accept', 'application/pdf');
        el.addEventListener('change', async (e) => {
            if (el.files && el.files.length > 0) {
                const file = el.files.item(0);

                if (file) {
                    const formData = new FormData();
                    formData.append('pdf', file);

                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/pdf`, {
                        method: 'POST',
                        body: formData
                    });

                    const collectionName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    setFiles(prev => [...prev, { name: file.name, size: file.size, collection: collectionName }]);
                    onUpload(collectionName);
                }
            }
        })
        el.click();
    }

    const handleRemove = async (file: UploadedFile) => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/delete/${file.collection}`, { method: 'DELETE' });
        setFiles(prev => prev.filter(f => f.collection !== file.collection));
    }

    return (
        <div className="h-full flex flex-col w-full">
            <div className="flex-1 flex items-center justify-center flex-col">
                <div onClick={handleUploadButtonClick} className="bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border gap-2 cursor-pointer">
                    <h3>Upload PDF File</h3>
                    <Upload />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                    {
                        files.map((file, index) => (
                            <div className="flex items-center gap-14 bg-gray-200 rounded px-2 border-black border relative justify-between" key={index}>
                                <p className="tracking-tight">{file.name}</p>
                                <p className="tracking-tightest text-[10px] opacity-80">{(file.size / 1024).toFixed(2)} KB</p>
                                <button onClick={() => handleRemove(file)} className="ml-1 text-gray-500 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="absolute top-0 left-0 p-4">
                <UserButton></UserButton>
            </div>
        </div>
    )
}

export default FileUploadComponent