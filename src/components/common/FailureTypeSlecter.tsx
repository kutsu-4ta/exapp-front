import type {FailureType} from "@/types/workspace.ts";
import {FAILURE_TYPE_VALUES} from "@/types/workspace.ts";

type Props = {
    value: FailureType[]
    onChange: (
        next: FailureType[]
    ) => void
}

export function FailureTypeSelector({
                                        value,
                                        onChange,
                                    }: Props) {
    function toggle(
        ft: FailureType
    ) {
        const next =
            value.includes(ft)
                ? value.filter(
                    (x) => x !== ft
                )
                : [
                    ...value,
                    ft,
                ]

        onChange(next)
    }

    return (
        <>
            {FAILURE_TYPE_VALUES.map(
                (ft) => {
                    const selected =
                        value.includes(
                            ft
                        )

                    const colorMap = {
                        定義: {
                            color:
                                '#2563eb',
                            bg: selected
                                ? 'rgba(37,99,235,.12)'
                                : 'rgba(37,99,235,.05)',
                        },
                        解法: {
                            color:
                                '#d73a49',
                            bg: selected
                                ? 'rgba(215,58,73,.12)'
                                : 'rgba(215,58,73,.05)',
                        },
                        ケアレス: {
                            color:
                                '#d29922',
                            bg: selected
                                ? 'rgba(210,153,34,.12)'
                                : 'rgba(210,153,34,.05)',
                        },
                    } as const

                    return (
                        <button
                            key={ft}
                            type="button"
                            onClick={() =>
                                toggle(
                                    ft
                                )
                            }
                            style={{
                                ...failureTypePill,
                                color:
                                colorMap[
                                    ft
                                    ]
                                    .color,
                                backgroundColor:
                                colorMap[
                                    ft
                                    ].bg,
                                opacity:
                                    selected
                                        ? 1
                                        : 0.65,
                            }}
                        >
                            {ft}
                        </button>
                    )
                }
            )}
        </>
    )
}

const failureTypePill = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: '4px',
    border:
        '1px solid rgba(55, 53, 47, 0.12)',
    background:
        'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '1.2',
    color:
        'rgba(55, 53, 47, 0.65)',
    transition:
        'background 20ms ease-in 0s',
} as const