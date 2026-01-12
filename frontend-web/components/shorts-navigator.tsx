import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

export function ShortsNavigator() {
    return (
        <ButtonGroup
            orientation="vertical"
            aria-label="Media controls"
            className="h-fit hidden md:flex"
        >
            <Button variant="secondary" size="icon">
                <ChevronUp />
            </Button>
            <Button variant="secondary" size="icon">
                <ChevronDown />
            </Button>
        </ButtonGroup >
    )
}
