import {subjectUi} from "@/styles/subjectUI.ts";

export function SubjectDangerZone({
                                      subjectName,
                                      deleteSubject,
                                      subjects,
                                      setSubjects,
                                      subCategories,
                                      setSubCategories,
                                      navigate,
                                  }: any) {
    const handleDelete = async () => {
        // 標準のアラート（確認ダイアログ）を表示
        const confirmed = window.confirm(
            `「${subjectName}」を削除しますか？\nこの科目に紐づくすべてのデータが削除されます。`
        );

        if (confirmed) {
            await deleteSubject(subjectName);
            setSubjects(subjects.filter((s: string) => s !== subjectName));
            setSubCategories(
                subCategories.filter((sc: any) => sc.subject !== subjectName)
            );
            navigate("/");
        }
    };

    return (
        <div
            style={{ ...subjectUi.card, border: "1px solid rgba(235,87,87,0.25)" }}
        >
            <div style={{ ...subjectUi.title, color: "#eb5757" }}>DANGER ZONE</div>

            <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.6 }}>
                この操作は取り消せません。
            </div>

            <button style={deleteBtn} onClick={handleDelete}>
                delete this subject
            </button>
        </div>
    );
}

const deleteBtn: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "13px",
    width: "100%",
    color: "rgba(235, 87, 87, 0.6)",
    cursor: "pointer",
    fontWeight: 500,
};