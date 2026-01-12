export default function Page() {
    return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <video
                src="/vid.mp4"
                controls
                playsInline
                className="max-h-full max-w-full rounded-t-3xl md:rounded-3xl object-contain bg-black"
            />
        </div>
    )
}