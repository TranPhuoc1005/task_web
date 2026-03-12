"use client";

import { useState } from "react";
import { Plus, Search, Filter, Calendar, DollarSign, Users, BarChart3, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hook/useProjects";
import ProjectModal from "@/components/projects/ProjectModal";
import { Project } from "@/types/projects";

const PROJECT_TYPE_LABELS = {
    web_development: "Web Development",
    mobile_app: "Mobile App",
    design: "Design",
    infrastructure: "Infrastructure",
    data_science: "Data Science",
    other: "Other",
};

const STATUS_COLORS = {
    planning: "bg-gray-100 text-gray-700 border-gray-300",
    active: "bg-green-100 text-green-700 border-green-300",
    on_hold: "bg-yellow-100 text-yellow-700 border-yellow-300",
    completed: "bg-blue-100 text-blue-700 border-blue-300",
    cancelled: "bg-red-100 text-red-700 border-red-300",
};

const PRIORITY_COLORS = {
    low: "text-blue-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    critical: "text-red-600",
};

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, isLoading, createProject, currentUser } = useProjects();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const canCreateProject = currentUser?.profile?.role === "admin" || currentUser?.profile?.role === "manager";

    const filteredProjects = projects.filter((project: Project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getDaysUntilDeadline = (deadline: string) => {
        const now = new Date();
        const due = new Date(deadline);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleCreateProject = async (data: Partial<Project>) => {
        try {
            await createProject.mutateAsync(data);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create project:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Projects</h1>
                            <p className="text-slate-600">Manage your projects and track progress</p>
                        </div>
                        {canCreateProject && (
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                                <Plus className="w-4 h-4 mr-2" />
                                New Project
                            </Button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Projects</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {projects.filter((p) => p.status === "active").length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Budget</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        ${(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000).toFixed(0)}K
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Team Members</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {new Set(projects.flatMap((p) => p.members?.map((m) => m.user_id) || [])).size}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search projects..."
                                className="pl-10 bg-white border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="bg-white">
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </div>

                    {/* Filter Bar */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-700">Status:</span>
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        statusFilter === "all"
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}>
                                    All
                                </button>
                                {Object.keys(STATUS_COLORS).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                            statusFilter === status
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}>
                                        {status.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => {
                        const daysLeft = project.deadline ? getDaysUntilDeadline(project.deadline) : null;
                        const isOverdue = daysLeft !== null && daysLeft < 0;
                        const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

                        return (
                            <div
                                key={project.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
                                onClick={() => router.push(`/projects/${project.id}`)}>
                                {/* Color Bar */}
                                <div className="h-2" style={{ backgroundColor: project.color }} />

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                                        </div>
                                    </div>

                                    {/* Status and Priority */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                                                STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]
                                            }`}>
                                            {project.status.replace("_", " ")}
                                        </span>
                                        <span
                                            className={`text-xs font-bold uppercase ${
                                                PRIORITY_COLORS[project.priority as keyof typeof PRIORITY_COLORS]
                                            }`}>
                                            {project.priority}
                                        </span>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-600">Progress</span>
                                            <span className="text-xs font-bold text-slate-900">
                                                {project.progress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Technologies */}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-1">
                                                {project.technologies.slice(0, 3).map((tech, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {project.technologies.length > 3 && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                                                        +{project.technologies.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Info Grid */}
                                    {project.deadline && (
                                        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Deadline</p>
                                                    <p
                                                        className={`text-xs font-medium ${
                                                            isOverdue
                                                                ? "text-red-600"
                                                                : isDueSoon
                                                                ? "text-orange-600"
                                                                : "text-slate-900"
                                                        }`}>
                                                        {new Date(project.deadline).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Budget</p>
                                                    <p className="text-xs font-medium text-slate-900">
                                                        ${((project.budget || 0) / 1000).toFixed(0)}K
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Team and Tasks */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-600">
                                                {project.members?.length || 0} members
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-600">
                                                {project.tasks_count || 0} tasks
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deadline Warning */}
                                    {(isOverdue || isDueSoon) && (
                                        <div
                                            className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${
                                                isOverdue
                                                    ? "bg-red-50 border border-red-200"
                                                    : "bg-orange-50 border border-orange-200"
                                            }`}>
                                            <AlertCircle
                                                className={`w-4 h-4 ${isOverdue ? "text-red-600" : "text-orange-600"}`}
                                            />
                                            <span
                                                className={`text-xs font-medium ${
                                                    isOverdue ? "text-red-700" : "text-orange-700"
                                                }`}>
                                                {isOverdue
                                                    ? `Overdue by ${Math.abs(daysLeft)} days`
                                                    : `Due in ${daysLeft} days`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredProjects.length === 0 && !isLoading && (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
                        <p className="text-slate-600 mb-6">
                            {searchTerm
                                ? "Try adjusting your search or filters"
                                : "Get started by creating your first project"}
                        </p>
                        {canCreateProject && (
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Project Modal */}
            <ProjectModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleCreateProject}
                isSubmitting={createProject.isPending}
            />
        </div>
    );
}
