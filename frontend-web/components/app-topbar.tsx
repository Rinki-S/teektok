import { CircleUserRound } from "lucide-react"
import { Searchbar } from "./searchbar"
import { Button } from "./ui/button"
import { SidebarTrigger } from "./ui/sidebar"

export function AppTopbar() {
    return (
        <div className="bg-sidebar text-white px-4 py-2 w-full h-14 flex items-center gap-2">
            <SidebarTrigger className="md:hidden h-10 w-10 rounded-xl" />
            <div className="flex-1 flex justify-center">
                <Searchbar />
            </div>
            <Button className="h-full px-4 rounded-xl">
                <CircleUserRound size={16} strokeWidth={3} />
                <p className="text-[16px] font-semibold pt-0.5">登录</p>
            </Button>
        </div>
    )
}