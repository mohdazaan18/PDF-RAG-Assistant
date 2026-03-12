'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from '@clerk/nextjs'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface Doc {
    pageContent?: string,
    metadata?: {
        pdf?: {
            totalPages?: number
        },
        source?: string,
        page?: number,
        loc?: {
            lines?: {
                from?: number,
                to?: number
            },
            pageNumber?: number
        }
    }
}

interface IMessage {
    role: 'user' | 'assistant',
    content?: string,
    documents?: Doc[]
}

interface Props {
    collection: string | null;
}

const ChatComponent: React.FC<Props> = ({ collection }) => {

    const [message, setMessage] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);
    const [chatHistory, setChatHistory] = React.useState<IMessage[]>([]);

    const handleSendChat = async () => {
        setLoading(true);
        setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
        setMessage('');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat?message=${encodeURIComponent(message)}&collection=${collection}`);
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data?.message, documents: data?.docs }])
        setLoading(false);
    }

    return (
        <div className='h-dvh flex flex-col'>
            <ScrollArea className='flex-1 min-h-0 p-4 px-6'>
                {
                    chatHistory.map((chat, index) => (
                        <div key={index} className={`mb-4 flex items-center gap-1 ${chat.role === 'user' ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
                            <div className={`flex items-center gap-1 ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {
                                    chat.role === "user" ?
                                        <div className='flex justify-end'>
                                            <UserAvatar />
                                        </div>
                                        :
                                        <Avatar>
                                            <AvatarImage src="https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_5.png" />
                                            <AvatarFallback>Assistant</AvatarFallback>
                                        </Avatar>
                                }
                                <div className='max-w-[80%] text-sm bg-muted rounded-xl px-4 py-2 text-left'>
                                    <p>{chat.content}</p>
                                    <div>
                                        {
                                            chat.role === "assistant" && chat.documents && chat.documents.length > 0 && (
                                                <Accordion type="single" collapsible >
                                                    <AccordionItem value="item-1">
                                                        <AccordionTrigger className="cursor-pointer">
                                                            <p className="text-xs opacity-80">{chat.documents.length} Referenced Documents</p>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="flex">
                                                            {
                                                                chat.documents.map((doc, index) => (
                                                                    <HoverCard openDelay={10} closeDelay={100} key={index}>
                                                                        <HoverCardTrigger asChild>
                                                                            <Button variant="link">Page {doc?.metadata?.loc?.pageNumber} (lines : {doc?.metadata?.loc?.lines?.from} - {doc?.metadata?.loc?.lines?.to})</Button>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent className="flex w-64 flex-col gap-0.5">
                                                                            <div className="font-semibold"></div>
                                                                            <div className="line-clamp-8">{doc?.pageContent}</div>
                                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                                <p>{doc?.metadata?.source}</p>
                                                                            </div>
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                ))
                                                            }
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </ScrollArea>
            <div className='p-4 px-6 border-t'>
                <Field orientation="horizontal">
                    <Input value={message} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} onChange={(e) => setMessage(e.target.value)} type="search" placeholder="Type your query here..." className='h-10' />
                    <Button onClick={handleSendChat} className="cursor-pointer px-12 disabled:cursor-not-allowed disabled:pointer-events-auto h-10" disabled={message.trim().length <= 0 || loading}>{
                        loading ? <Spinner className="size-5" /> : 'Ask'
                    }</Button>
                </Field>
            </div>
        </div>
    )
}

export default ChatComponent