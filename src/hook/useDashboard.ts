"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/task";

export interface DashboardStats {
    totalTasks: number;
    inProgress: number;
    completed: number;
    overdue: number;
    totalChange: number;
    inProgressChange: number;
    completedChange: number;
    overdueChange: number;
}

export interface TasksByStatus {
    status: string;
    count: number;
    color: string;
}

export interface TasksByPriority {
    priority: string;
    count: number;
    color: string;
}

export interface RecentTask {
    id: number;
    title: string;
    status: Task["status"];
    priority: Task["priority"];
    due_date?: string;
    assignee?: string;
    created_at?: string;
}

export function useDashboard() {
    // Lấy tất cả tasks
    const tasksQuery = useQuery({
        queryKey: ["dashboard", "tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Task[];
        },
        refetchInterval: 30 * 1000,
    });

    // Lấy tasks từ tuần trước để tính % change
    const lastWeekTasksQuery = useQuery({
        queryKey: ["dashboard", "last-week-tasks"],
        queryFn: async () => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .lte("created_at", oneWeekAgo.toISOString());

            if (error) throw error;
            return data as Task[];
        },
    });

    const tasks = tasksQuery.data || [];
    const lastWeekTasks = lastWeekTasksQuery.data || [];

    // Tính stats
    const stats: DashboardStats = {
        totalTasks: tasks.length,
        inProgress: tasks.filter((t) => t.status === "in-progress").length,
        completed: tasks.filter((t) => t.status === "done").length,
        overdue: tasks.filter((t) => {
            if (!t.due_date) return false;
            return new Date(t.due_date) < new Date() && t.status !== "done";
        }).length,
        totalChange: calculateChange(tasks.length, lastWeekTasks.length),
        inProgressChange: calculateChange(
            tasks.filter((t) => t.status === "in-progress").length,
            lastWeekTasks.filter((t) => t.status === "in-progress").length
        ),
        completedChange: calculateChange(
            tasks.filter((t) => t.status === "done").length,
            lastWeekTasks.filter((t) => t.status === "done").length
        ),
        overdueChange: calculateChange(
            tasks.filter((t) => {
                if (!t.due_date) return false;
                return new Date(t.due_date) < new Date() && t.status !== "done";
            }).length,
            lastWeekTasks.filter((t) => {
                if (!t.due_date) return false;
                return new Date(t.due_date) < new Date() && t.status !== "done";
            }).length
        ),
    };

    // Dữ liệu cho biểu đồ theo status
    const tasksByStatus: TasksByStatus[] = [
        {
            status: "To Do",
            count: tasks.filter((t) => t.status === "todo").length,
            color: "#64748b",
        },
        {
            status: "In Progress",
            count: tasks.filter((t) => t.status === "in-progress").length,
            color: "#f59e0b",
        },
        {
            status: "Review",
            count: tasks.filter((t) => t.status === "review").length,
            color: "#3b82f6",
        },
        {
            status: "Done",
            count: tasks.filter((t) => t.status === "done").length,
            color: "#10b981",
        },
    ];

    // Dữ liệu cho biểu đồ theo priority
    const tasksByPriority: TasksByPriority[] = [
        {
            priority: "Low",
            count: tasks.filter((t) => t.priority === "low").length,
            color: "#3b82f6",
        },
        {
            priority: "Medium",
            count: tasks.filter((t) => t.priority === "medium").length,
            color: "#f59e0b",
        },
        {
            priority: "High",
            count: tasks.filter((t) => t.priority === "high").length,
            color: "#ef4444",
        },
    ];

    const recentTasks: RecentTask[] = tasks.slice(0, 10).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        assignee: task.profiles?.full_name || task.profiles?.email || undefined,
        created_at: task.created_at,
    }));

    return {
        stats,
        tasksByStatus,
        tasksByPriority,
        recentTasks,
        isLoading: tasksQuery.isLoading || lastWeekTasksQuery.isLoading,
        error: tasksQuery.error || lastWeekTasksQuery.error,
    };
}

// Helper function để tính % change
function calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}