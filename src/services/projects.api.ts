import { Project, ProjectMember, ProjectMemberRole } from "@/types/projects";
import { createClient } from "../lib/supabase/client";

// Define proper types for database responses
interface ProjectMemberRow {
    project_id: string;
}

interface TaskRow {
    project_id: string;
    status: string;
}

interface ProjectRow {
    id: string;
    name: string;
    description?: string;
    project_type: string;
    status: string;
    technologies?: string[];
    programming_languages?: string[];
    start_date?: string;
    deadline?: string;
    actual_completion_date?: string;
    budget?: number;
    currency: string;
    project_manager_id?: string;
    client_name?: string;
    client_email?: string;
    priority: string;
    progress: number;
    color: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

interface ProfileRow {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role?: string;
    department?: string;
}

interface ProjectMemberDbRow {
    id: string;
    user_id: string;
    project_id: string;
    role: ProjectMemberRole;
    hourly_rate?: number;
    allocated_hours?: number;
    joined_at: string;
}

interface ProjectMemberWithProfile extends ProjectMemberDbRow {
    profile?: ProfileRow;
}

export const listProjectsApi = async (): Promise<Project[]> => {
    const supabase = createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Not authenticated");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        let query = supabase
            .from("projects")
            .select(`
                *,
                project_manager:project_manager_id(id, full_name, email)
            `)
            .order("created_at", { ascending: false });

        // Employee chỉ thấy projects mình tham gia
        if (profile?.role === "employee") {
            const { data: memberProjects, error: memberError } = await supabase
                .from("project_members")
                .select("project_id")
                .eq("user_id", user.id);

            if (memberError) throw memberError;

            if (!memberProjects || memberProjects.length === 0) {
                return [];
            }

            const projectIds = memberProjects.map((m: ProjectMemberRow) => m.project_id);
            query = query.in("id", projectIds);
        }

        const { data: projects, error } = await query;

        if (error) throw error;
        if (!projects || projects.length === 0) return [];

        // Get all project manager IDs
        const pmIds = [...new Set((projects as ProjectRow[]).map((p: ProjectRow) => p.project_manager_id).filter(Boolean))];
        
        // Get all project managers
        const { data: managers } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", pmIds);

        const managerMap = new Map<string, ProfileRow>(managers?.map((m: ProfileRow) => [m.id, m]) || []);

        // Get all project IDs
        const projectIds = projects.map((p: ProjectRow) => p.id);

        // Get all members for all projects
        const { data: allMembers } = await supabase
            .from("project_members")
            .select(`
                id,
                user_id,
                project_id,
                role,
                hourly_rate,
                allocated_hours,
                joined_at
            `)
            .in("project_id", projectIds);

        // Get all member profiles
        const memberUserIds = [...new Set(allMembers?.map((m: ProjectMemberDbRow) => m.user_id) || [])];
        const { data: memberProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", memberUserIds);

        const profileMap = new Map<string, ProfileRow>(memberProfiles?.map((p: ProfileRow) => [p.id, p]) || []);

        // Get task counts for all projects
        const { data: taskCounts } = await supabase
            .from("tasks")
            .select("project_id")
            .in("project_id", projectIds);

        const taskCountMap = new Map<string, number>();
        taskCounts?.forEach((task: TaskRow) => {
            const count = taskCountMap.get(task.project_id) || 0;
            taskCountMap.set(task.project_id, count + 1);
        });

        // Combine all data
        const result = projects.map((project: ProjectRow) => {
            const members = (allMembers || [])
                .filter((m: ProjectMemberDbRow) => m.project_id === project.id)
                .map((m: ProjectMemberDbRow): ProjectMemberWithProfile => ({
                    ...m,
                    profile: profileMap.get(m.user_id)
                }));

            return {
                ...project,
                project_manager: project.project_manager_id ? managerMap.get(project.project_manager_id) : null,
                members,
                tasks_count: taskCountMap.get(project.id) || 0
            };
        });

        return result as Project[];
    } catch (error) {
        console.error("listProjectsApi error:", error);
        throw error;
    }
};

export const getProjectByIdApi = async (id: string): Promise<Project> => {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    // Get project manager
    let project_manager = null;
    if (project.project_manager_id) {
        const { data: pmData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", project.project_manager_id)
            .maybeSingle();
        project_manager = pmData;
    }

    // Get members
    const { data: members } = await supabase
        .from("project_members")
        .select(`
            id,
            user_id,
            role,
            hourly_rate,
            allocated_hours,
            joined_at
        `)
        .eq("project_id", id);

    // Get member profiles
    if (members && members.length > 0) {
        const userIds = members.map((m: ProjectMemberDbRow) => m.user_id);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds);

        const profileMap = new Map<string, ProfileRow>(profiles?.map((p: ProfileRow) => [p.id, p]) || []);
        
        members.forEach((member: ProjectMemberDbRow) => {
            (member as ProjectMemberWithProfile).profile = profileMap.get(member.user_id);
        });
    }

    // Count tasks
    const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id);

    return { 
        ...project, 
        project_manager,
        members: (members || []) as ProjectMemberWithProfile[],
        tasks_count: count || 0 
    } as Project;
};

export const createProjectApi = async (projectData: Partial<Project>): Promise<Project> => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("projects")
        .insert([{ ...projectData, created_by: user.id }])
        .select("*")
        .single();

    if (error) throw error;

    // Get project manager info if exists
    let project_manager = null;
    if (data.project_manager_id) {
        const { data: pmData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", data.project_manager_id)
            .maybeSingle();
        project_manager = pmData;
    }

    return { ...data, project_manager, members: [], tasks_count: 0 } as Project;
};

export const updateProjectApi = async ({
    id,
    updates,
}: {
    id: string;
    updates: Partial<Project>;
}): Promise<Project> => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("projects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

    if (error) throw error;

    // Get project manager
    let project_manager = null;
    if (data.project_manager_id) {
        const { data: pmData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", data.project_manager_id)
            .maybeSingle();
        project_manager = pmData;
    }

    // Get members
    const { data: members } = await supabase
        .from("project_members")
        .select(`
            id,
            user_id,
            role,
            hourly_rate,
            allocated_hours,
            joined_at
        `)
        .eq("project_id", id);

    // Get member profiles
    if (members && members.length > 0) {
        const userIds = members.map((m: ProjectMemberDbRow) => m.user_id);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds);

        const profileMap = new Map<string, ProfileRow>(profiles?.map((p: ProfileRow) => [p.id, p]) || []);
        
        members.forEach((member: ProjectMemberDbRow) => {
            (member as ProjectMemberWithProfile).profile = profileMap.get(member.user_id);
        });
    }

    return { ...data, project_manager, members: (members || []) as ProjectMemberWithProfile[] } as Project;
};

export const deleteProjectApi = async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
};


export const listProjectMembersApi = async (projectId: string): Promise<ProjectMember[]> => {
    const supabase = createClient();
    
    const { data: members, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: false });

    if (error) throw error;
    if (!members || members.length === 0) return [];

    // Get all profiles
    const userIds = members.map((m: ProjectMemberDbRow) => m.user_id);
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, department")
        .in("id", userIds);

    const profileMap = new Map<string, ProfileRow>(profiles?.map((p: ProfileRow) => [p.id, p]) || []);

    return members.map((member: ProjectMemberDbRow): ProjectMember => ({
        ...member,
        profile: profileMap.get(member.user_id)
    }));
};

export const addProjectMemberApi = async ({
    projectId,
    userId,
    role,
    hourlyRate,
    allocatedHours,
}: {
    projectId: string;
    userId: string;
    role: ProjectMemberRole;
    hourlyRate?: number;
    allocatedHours?: number;
}): Promise<ProjectMember> => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Check if member already exists
    const { data: existing } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

    if (existing) {
        throw new Error("User is already a member of this project");
    }

    const { data, error } = await supabase
        .from("project_members")
        .insert([
            {
                project_id: projectId,
                user_id: userId,
                role,
                hourly_rate: hourlyRate,
                allocated_hours: allocatedHours,
            },
        ])
        .select("*")
        .single();

    if (error) throw error;

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", userId)
        .single();

    return { ...data, profile } as ProjectMember;
};

export const updateProjectMemberApi = async (
    supabase: ReturnType<typeof createClient>,
    membershipId: string,
    updates: Partial<ProjectMember>
): Promise<ProjectMember> => {
    const { data, error } = await supabase
        .from("project_members")
        .update(updates)
        .eq("id", membershipId)
        .select("*")
        .single();

    if (error) throw error;

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", data.user_id)
        .single();

    return { ...data, profile } as ProjectMember;
};

export const removeProjectMemberApi = async (membershipId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from("project_members").delete().eq("id", membershipId);
    if (error) throw error;
};


export const getProjectStatsApi = async (projectId: string) => {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get tasks count by status
    const { data: tasksByStatus } = await supabase.from("tasks").select("status").eq("project_id", projectId);

    const statusCounts = {
        todo: 0,
        "in-progress": 0,
        review: 0,
        done: 0,
    };

    tasksByStatus?.forEach((task: TaskRow) => {
        if (task.status in statusCounts) {
            statusCounts[task.status as keyof typeof statusCounts]++;
        }
    });

    // Get overdue tasks
    const { count: overdueCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .lt("deadline", new Date().toISOString())
        .neq("status", "done");

    // Get total members
    const { count: membersCount } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

    return {
        tasksByStatus: statusCounts,
        totalTasks: tasksByStatus?.length || 0,
        overdueTasks: overdueCount || 0,
        totalMembers: membersCount || 0,
    };
};