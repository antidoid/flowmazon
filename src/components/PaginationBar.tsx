import Link from "next/link"

type PaginationBarProps = {
    currentPage: number,
    totalPages: number
}

export default function PaginationBar(
    { currentPage, totalPages }: PaginationBarProps
) {
    const maxPageToShow = Math.min(totalPages, Math.max(currentPage + 4, 10))
    const minPageToShow = Math.max(1, Math.min(currentPage - 5, maxPageToShow - 9))

    const numberredPageItems: JSX.Element[] = []
    for (let page = minPageToShow; page <= maxPageToShow; page++) {
        numberredPageItems.push(
            <Link
                href={`?page=${page}`}
                key={page}
                className={`join-item btn ${currentPage === page && "btn-active pointer-events-none"}`}
            >
                {page}
            </Link>
        )
    }

    return (
        <>
            <div className="join hidden sm:block">
                {numberredPageItems}
            </div>
            <div className="join block sm:hidden">
                {currentPage > 1 &&
                    <Link href={`?page=${currentPage - 1}`} className="btn join-item">
                        «
                    </Link>
                }
                <button className="join-item btn pointer-events-auto">
                    Page {currentPage}
                </button>
                {currentPage < totalPages &&

                    <Link href={`?page=${currentPage + 1}`} className="btn join-item">
                        »
                    </Link>
                }
            </div>
        </>
    )
}
