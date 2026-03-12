"use client";

import { useState, useMemo } from "react";
import { Column, Task } from "@/types/task";
import KanbanColumn from "./KanbanColumn";
import { useTasks } from "@/hook/useTasks";
import { UserX, Users } from "lucide-react";

export default function KanbanBoard() {
    const { tasks, isError, moveTask, currentUser } = useTasks();
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);

    const isAdminOrManager = currentUser?.profile?.role === "admin" || currentUser?.profile?.role === "manager";

    // Filter tasks dựa vào toggle
    const filteredTasks = useMemo(() => {
        if (!showOnlyUnassigned) return tasks;
        return tasks.filter((task) => !task.user_id);
    }, [tasks, showOnlyUnassigned]);

    const unassignedCount = useMemo(() => {
        return tasks.filter((task) => !task.user_id).length;
    }, [tasks]);

    if (isError) return <p className="p-6 text-red-500">Error loading tasks</p>;

    const columns: Column[] = [
        {
            id: "todo",
            title: "To Do",
            status: "todo",
            tasks: filteredTasks.filter((t) => t.status === "todo"),
        },
        {
            id: "in-progress",
            title: "In Progress",
            status: "in-progress",
            tasks: filteredTasks.filter((t) => t.status === "in-progress"),
        },
        {
            id: "review",
            title: "Review",
            status: "review",
            tasks: filteredTasks.filter((t) => t.status === "review"),
        },
        {
            id: "done",
            title: "Done",
            status: "done",
            tasks: filteredTasks.filter((t) => t.status === "done"),
        },
    ];

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, toStatus: Task["status"]) => {
        e.preventDefault();
        if (!draggedTask || draggedTask.status === toStatus) return;

        moveTask.mutate({ id: draggedTask.id, status: toStatus });
        setDraggedTask(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Filter Bar - chỉ hiện cho admin/manager */}
            {isAdminOrManager && unassignedCount > 0 && (
                <div className="px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <UserX className="w-4 h-4 text-orange-500" />
                                <span>
                                    <span className="font-semibold text-orange-600">{unassignedCount}</span> task
                                    {unassignedCount !== 1 ? "s" : ""} not assigned
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowOnlyUnassigned(!showOnlyUnassigned)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
                                transition-all duration-200 text-sm
                                ${
                                    showOnlyUnassigned
                                        ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }
                            `}>
                            {showOnlyUnassigned ? (
                                <>
                                    <Users className="w-4 h-4" />
                                    Show All Tasks
                                </>
                            ) : (
                                <>
                                    <UserX className="w-4 h-4" />
                                    Show Unassigned Only
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-6 p-6 h-full">
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>
            </div>

            {/* Empty State khi filter unassigned */}
            {showOnlyUnassigned && filteredTasks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">All tasks are assigned! 🎉</h3>
                        <p className="text-sm text-slate-600">Great job! Every task has an assignee.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
