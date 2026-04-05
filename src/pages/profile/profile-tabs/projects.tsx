import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import type { AuthUser } from "../../../types/app";

export function ProjectsTab({user}:{user: AuthUser}) {
    return (
        <Card>
            <CardBody className="p-4">
            <div>
                <CardTitle className="text-3xl">My projects</CardTitle>
                <CardDescription className="mt-2 text-base">
                Here you can see all of your projects and manage their status or 
                </CardDescription>
                
            </div>
            </CardBody>
        </Card>
    )
}