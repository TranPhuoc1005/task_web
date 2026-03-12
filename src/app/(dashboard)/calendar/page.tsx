"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter, Clock } from "lucide-react";
import { useTasks } from "@/hook/useTasks";
import TaskModal from "@/components/tasks/TaskModal";
import { Task } from "@/types/task";

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
    const { tasks, updateDueDate, currentUser, isLoading } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedDateForTask, setSelectedDateForTask] = useState<string | undefined>(undefined);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const canCreateTask = currentUser?.profile?.role === "admin" || currentUser?.profile?.role === "manager";

    // Calendar calculations
    const { monthEnd, startDate } = useMemo(() => {
        const mEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const sDate = new Date(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
        sDate.setDate(sDate.getDate() - sDate.getDay());
        return { monthEnd: mEnd, startDate: sDate };
    }, [currentDate]);

    const calendarDays = useMemo(() => {
        const days = [];
        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const currentDay = new Date(startDate);
        while (currentDay <= endDate) {
            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }
        return days;
    }, [startDate, monthEnd]);

    const getTasksForDate = (date: Date) => {
        return tasks.filter((task) => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            );
        });
    };

    // Navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-500";
            case "medium":
                return "bg-yellow-500";
            case "low":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const formatMonthYear = () => {
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        if (!draggedTask) return;

        const newDate = new Date(date);
        newDate.setHours(12, 0, 0, 0);
        const newDueDate = newDate.toISOString();

        await updateDueDate.mutateAsync({
            id: draggedTask.id,
            due_date: newDueDate,
        });

        setDraggedTask(null);
    };

    const handleAddTaskToDate = (date: Date) => {
        const dateStr = new Date(date.setHours(12, 0, 0, 0)).toISOString().slice(0, 16);
        setSelectedDateForTask(dateStr);
        setIsTaskModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between flex-col gap-5 md:flex-row">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
                        <p className="text-sm text-slate-600 mt-1">Manage your tasks and deadlines</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {canCreateTask && (
                            <button
                                onClick={() => {
                                    setSelectedDateForTask(undefined);
                                    setIsTaskModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">New Task</span>
                            </button>
                        )}
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filter</span>
                        </button>
                    </div>
                </div>

                {/* Calendar Controls */}
                <div className="flex items-center justify-between mt-6 flex-col md:flex-row gap-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Today
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold text-slate-900 min-w-auto md:min-w-[200px]">
                            {formatMonthYear()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("month")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                viewMode === "month"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}>
                            Month
                        </button>
                        <button
                            onClick={() => setViewMode("week")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                viewMode === "week"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}>
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode("day")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                viewMode === "day"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}>
                            Day
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                                key={day}
                                className="py-3 text-center text-sm font-semibold text-slate-700 border-r border-slate-200 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, index) => {
                            const tasksForDay = getTasksForDate(day);
                            const isTodayDate = isToday(day);
                            const isCurrentMonthDate = isCurrentMonth(day);

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[120px] border-r border-b border-slate-200 p-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                                        !isCurrentMonthDate ? "bg-slate-50/50" : ""
                                    } last:border-r-0`}
                                    onClick={() => setSelectedDate(day)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, day)}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className={`text-sm font-medium ${
                                                isTodayDate
                                                    ? "w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white"
                                                    : isCurrentMonthDate
                                                    ? "text-slate-900"
                                                    : "text-slate-400"
                                            }`}>
                                            {day.getDate()}
                                        </div>
                                        {canCreateTask && tasksForDay.length === 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddTaskToDate(day);
                                                }}
                                                className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded">
                                                <Plus className="w-3 h-3 text-blue-600" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Tasks for this day */}
                                    <div className="space-y-1">
                                        {tasksForDay.slice(0, 3).map((task) => (
                                            <div
                                                key={task.id}
                                                draggable={canCreateTask}
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                className={`text-xs p-1.5 rounded ${getPriorityColor(
                                                    task.priority
                                                )} bg-opacity-10 border-l-2 ${getPriorityColor(
                                                    task.priority
                                                )} hover:bg-opacity-20 transition-colors ${
                                                    canCreateTask ? "cursor-move" : ""
                                                }`}>
                                                <div className="font-medium text-slate-900 truncate">{task.title}</div>
                                                <div className="text-slate-600 truncate flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(task.due_date!).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {tasksForDay.length > 3 && (
                                            <div className="text-xs text-slate-500 font-medium pl-1">
                                                +{tasksForDay.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white border-t border-slate-200 px-6 py-3">
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-slate-700">Priority:</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-slate-600">High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-sm text-slate-600">Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-slate-600">Low</span>
                        </div>
                    </div>
                    {canCreateTask && (
                        <span className="text-sm text-slate-500 ml-auto">💡 Drag tasks to change due dates</span>
                    )}
                </div>
            </div>

            {/* Selected Date Modal/Panel */}
            {selectedDate && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setSelectedDate(null)}>
                    <div
                        className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {selectedDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </h3>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {getTasksForDate(selectedDate).length > 0 ? (
                                getTasksForDate(selectedDate).map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-slate-900">{task.title}</h4>
                                                {task.description && (
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <p className="text-sm text-slate-600 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.due_date!).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                    {task.profiles && (
                                                        <p className="text-sm text-slate-500">
                                                            👤 {task.profiles.full_name || task.profiles.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                                    task.priority === "high"
                                                        ? "bg-red-100 text-red-700"
                                                        : task.priority === "medium"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No tasks scheduled for this day</p>
                                </div>
                            )}
                        </div>

                        {canCreateTask && (
                            <button
                                onClick={() => {
                                    handleAddTaskToDate(selectedDate);
                                    setSelectedDate(null);
                                }}
                                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Task for this Date
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Task Modal */}
            <TaskModal
                open={isTaskModalOpen}
                onOpenChange={setIsTaskModalOpen}
                defaultStatus="todo"
                defaultDueDate={selectedDateForTask}
            />
        </div>
    );
}
