import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { PlusIcon, Search } from 'lucide-react'
import { Button } from '../../../components/ui/button'

import { useNavigate } from 'react-router-dom'

import type { ApiResponse, AuthUser, ProjectResponse } from "../../../types/app";

import { getProjectsFromCurrentUser } from '../../../lib/user-storage';
import { useEffect, useState } from 'react';

export function ProjectsTab({user}:{user: AuthUser}) {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<ProjectResponse[] | null>();
    
    useEffect(() => {
        const data = async () => { 
            const response = await getProjectsFromCurrentUser() 
            console.log(response)
        }
        data()
    }, [])

    return (
        <Card>
            <CardBody className="p-4 flex flex-col gap-2">
            <div>
                <CardTitle className="text-3xl">My projects</CardTitle>
                <CardDescription className="mt-2 text-base">
                Here you can see all of your projects and create new ones.
                </CardDescription>
            </div>
            <section className='flex flex-row'>
                <div className="hidden md:block">
                    <div className="flex h-12 items-center gap-3 rounded-l-2xl border border-slate-200 bg-white px-4 shadow-sm">
                        <Search size={18} className="text-slate-400" />
                        <input
                        type="text"
                        placeholder="Search"
                        aria-label="Search"
                        className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <Button className='rounded-l-none h-12' variant="primary" size="lg" onClick={() => console.log('get')}>
                  <PlusIcon size={16}/>
                </Button>
            </section>
            <section>

            </section>
            </CardBody>
        </Card>
    )
}