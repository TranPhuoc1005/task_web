import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    listTasksApi,
    createTaskApi,
    updateTaskApi,
    moveTaskApi,
    deleteTaskApi,
    updateDueDateApi,
} from "@/services/task.api";
import { useAuth } from "./useAuth";

export function useTasks() {
    const queryClient = useQueryClient();

    const { currentUser } = useAuth();

    const tasksQuery = useQuery({
        queryKey: ["tasks"],
        queryFn: listTasksApi,
    });

    const createTask = useMutation({
        mutationFn: createTaskApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    const updateTask = useMutation({
        mutationFn: updateTaskApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    const moveTask = useMutation({
        mutationFn: moveTaskApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    const deleteTask = useMutation({
        mutationFn: deleteTaskApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    const updateDueDate = useMutation({
        mutationFn: ({ id, due_date }: { id: number; due_date: string }) => updateDueDateApi(id, due_date),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    return {
        currentUser,
        tasks: tasksQuery.data || [],
        isLoading: tasksQuery.isLoading,
        isError: tasksQuery.isError,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        updateDueDate,
    };
}
