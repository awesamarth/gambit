import Pieces from "./Pieces"

export default function Board() {
    const ranks = Array(8).fill(0).map((x, i) => 8 - i)
    const files = Array(8).fill(0).map((x, i) => i + 1)

    return (
        <div className="flex relative">
            {/* Ranks (rows) on the left */}
            <div className="flex flex-col justify-around mr-2 text-white">
                {ranks.map(rank => (
                    <div key={rank}>{rank}</div>
                ))}
            </div>

            <Pieces />

            <div className="flex flex-col">
                {/* Main board */}
                <div className=" grid grid-cols-8 grid-rows-8 w-[40rem] h-[40rem]">
                    {ranks.map((rank, i) =>
                        files.map((file, j) =>
                            <div className={`${(i + j) % 2 == 0 ? "bg-[#F0D8B7]" : "bg-[#B48764]"} `}
                                key={rank + file.toString()}>
                            </div>
                        ))}
                </div>

                {/* Files (columns) at the bottom */}
                <div className="flex justify-around mt-2 text-white">
                    {files.map(file => (
                        <div key={file}>{getCharacter(file)}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const getCharacter = (file: number) => String.fromCharCode(file + 96)