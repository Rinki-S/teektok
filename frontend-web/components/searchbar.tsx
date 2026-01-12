import {
    InputGroup,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group"
import { Search } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Searchbar() {
    return (
        <InputGroup className="w-full max-w-md mx-auto px-2 h-full rounded-xl">
            <InputGroupInput placeholder="搜索..." className="text-[16px]! font-semibold! pt-0.5!" />
            <InputGroupButton>
                <InputGroupText className="gap-1 hidden md:flex">
                    <Separator orientation="vertical" className="mx-2" />
                    <Search size={16} strokeWidth={3} />
                    <span className="text-[16px] font-semibold pt-0.5">搜索</span>
                </InputGroupText>
            </InputGroupButton>
        </InputGroup>
    )
}