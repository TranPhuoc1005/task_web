import { Task } from "@/types/task";
import { createClient } from "../lib/supabase/client";

export const listTasksApi = async (): Promise<Task[]> => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    let query = supabase
        .from("tasks")
        .select(
            `
            *,
            profiles:user_id (
                id,
                email,
                full_name,
                department
            )
            `
        )
        .order("created_at", { ascending: false });

    if (profile?.role === "employee") {
        query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
};

export const getTaskByIdApi = async (id: number): Promise<Task> => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("tasks")
        .select(
            `
            *,
            profiles:user_id (
                id,
                email,
                full_name,
                department
            )
            `
        )
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
};

export const createTaskApi = async (taskData: Partial<Task>): Promise<Task> => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Prepare task data - remove id if it exists (auto-generated)
    const { id, profiles, ...cleanTaskData } = taskData as any;

    // If user_id is not provided or is invalid, use current user
    const dataToInsert = {
        ...cleanTaskData,
        created_by: user.id,
        // Only include user_id if it's a valid UUID, otherwise use current user
        user_id:
            cleanTaskData.user_id && typeof cleanTaskData.user_id === "string" && cleanTaskData.user_id.length > 10
                ? cleanTaskData.user_id
                : user.id,
    };

    console.log("Creating task with data:", dataToInsert);

    const { data, error } = await supabase
        .from("tasks")
        .insert([dataToInsert])
        .select(
            `
            *,
            profiles:user_id (
                id,
                email,
                full_name,
                department
            )
            `
        )
        .single();

    if (error) {
        console.error("Create task error:", error);
        throw error;
    }
    return data;
};

export const updateTaskApi = async ({ id, updates }: { id: number; updates: Partial<Task> }): Promise<Task> => {
    const supabase = createClient();

    // Remove fields that shouldn't be updated
    const { profiles, created_by, created_at, ...cleanUpdates } = updates as any;

    // Validate user_id if it's being updated
    if (cleanUpdates.user_id !== undefined) {
        if (!cleanUpdates.user_id || typeof cleanUpdates.user_id !== "string" || cleanUpdates.user_id.length < 10) {
            delete cleanUpdates.user_id;
        }
    }

    console.log("Updating task with data:", cleanUpdates);

    const { data, error } = await supabase
        .from("tasks")
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(
            `
            *,
            profiles:user_id (
                id,
                email,
                full_name,
                department
            )
            `
        )
        .single();

    if (error) {
        console.error("Update task error:", error);
        throw error;
    }
    return data;
};

export const moveTaskApi = async ({ id, status }: { id: number; status: Task["status"] }): Promise<Task> => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(
            `
            *,
            profiles:user_id (
                id,
                email,
                full_name,
                department
            )
            `
        )
        .single();

    if (error) throw error;
    return data;
};

export const deleteTaskApi = async (id: number): Promise<void> => {
    const supabase = createClient();

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
};

export const updateDueDateApi = async (id: number, due_date: string): Promise<Task> => {
    const supabase = createClient();

    const { data, error } = await supabase.from("tasks").update({ due_date }).eq("id", id).select("*").single();

    if (error) {
        console.error("updateDueDateApi ~ error:", error);
        throw new Error(error.message);
    }

    return data;
};
