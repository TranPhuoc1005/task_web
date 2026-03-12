"use client";

import { Bell, BellRing, Clock, Trash2, Edit, CheckCircle, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useNotifications } from "@/hook/useNotifications";
import { ActivityLog } from "@/types/notifications";

export default function NotificationDropdown() {
    const { dueSoonTasks, recentActivities, totalNotifications, isLoading } = useNotifications();
    const formatTimeAgo = (date: string) => {
        if (!date) return "Unknown";

        const now = Date.now();
        const activityDate = new Date(date).getTime();
        const diff = now - activityDate;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 30) return "Vừa xong";
        if (seconds < 60) return `${seconds} giây trước`;
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const formatExactTime = (date: string) => {
        if (!date) return "";
        const dateObj = new Date(date);

        // Kiểm tra nếu là date-only (00:00:00) thì chỉ hiển thị ngày
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const seconds = dateObj.getSeconds();

        if (hours === 0 && minutes === 0 && seconds === 0) {
            // Chỉ hiển thị ngày cho due_date
            return dateObj.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }

        // Hiển thị đầy đủ cho created_at/updated_at
        return dateObj.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getHoursLeft = (dueDate: string) => {
        const diff = new Date(dueDate).getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày`;
        if (hours > 0) return `${hours} giờ`;
        if (hours > -1) return "Sắp tới hạn";
        return "Quá hạn";
    };

    const getActivityIcon = (action: ActivityLog["action"]) => {
        switch (action) {
            case "created":
                return "✨";
            case "updated":
                return <Edit className="w-3 h-3" />;
            case "deleted":
                return <Trash2 className="w-3 h-3 text-red-500" />;
            case "status_changed":
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case "assigned":
                return <UserPlus className="w-3 h-3 text-blue-500" />;
            case "priority_changed":
                return "🔥";
            case "due_date_changed":
                return "📅";
            default:
                return "📝";
        }
    };

    const getActivityText = (activity: ActivityLog) => {
        const userName = activity.user_name || "Someone";
        const changesCount = activity.changes_count;

        switch (activity.action) {
            case "created":
                return `${userName} đã tạo task mới`;
            case "updated":
                return changesCount && changesCount > 1
                    ? `${userName} đã cập nhật task (${changesCount} thay đổi)`
                    : `${userName} đã cập nhật task`;
            case "deleted":
                return `${userName} đã xóa task`;
            case "status_changed":
                return `Trạng thái: ${activity.old_value} → ${activity.new_value}`;
            case "assigned":
                return `Giao cho: ${activity.new_value}`;
            case "priority_changed":
                return `Ưu tiên: ${activity.old_value} → ${activity.new_value}`;
            case "due_date_changed":
                const oldDate = activity.old_value
                    ? new Date(activity.old_value).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                      })
                    : "Chưa có";
                const newDate = activity.new_value
                    ? new Date(activity.new_value).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                      })
                    : "Chưa có";
                return `Hạn: ${oldDate} → ${newDate}`;
            default:
                return `${userName} đã thao tác với task`;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                    {totalNotifications > 0 ? (
                        <BellRing className="w-5 h-5 text-blue-600" />
                    ) : (
                        <Bell className="w-5 h-5" />
                    )}
                    {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                            {totalNotifications > 9 ? "9+" : totalNotifications}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
                <div className="px-4 py-3 border-b sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">Thông báo</h3>
                    <p className="text-sm text-slate-600">
                        {totalNotifications > 0
                            ? `Bạn có ${totalNotifications} thông báo mới`
                            : "Không có thông báo mới"}
                    </p>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-slate-600 mt-2">Đang tải...</p>
                    </div>
                ) : totalNotifications === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Tất cả đã xong!</p>
                        <p className="text-xs mt-1">Không có thông báo mới</p>
                    </div>
                ) : (
                    <>
                        {/* Tasks Sắp Hết Hạn */}
                        {dueSoonTasks.length > 0 && (
                            <>
                                <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                                    ⏰ Sắp đến hạn
                                </DropdownMenuLabel>
                                {dueSoonTasks.map((task) => (
                                    <Link key={task.id} href={`/tasks?taskId=${task.id}`}>
                                        <DropdownMenuItem className="px-4 py-3 cursor-pointer flex-col items-start hover:bg-slate-50">
                                            <div className="flex items-start justify-between w-full mb-1">
                                                <p className="font-medium text-slate-900 flex-1 pr-2">{task.title}</p>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        task.priority === "high"
                                                            ? "bg-red-100 text-red-700"
                                                            : task.priority === "medium"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Còn {getHoursLeft(task.due_date!)}
                                                </span>
                                                {task.profiles && (
                                                    <span className="flex items-center gap-1">👤 {task.profiles.full_name || task.profiles.email}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                📅{" "}
                                                {new Date(task.due_date!).toLocaleDateString("vi-VN", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    weekday: "short",
                                                })}
                                            </div>
                                        </DropdownMenuItem>
                                    </Link>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        )}

                        {/* Recent Activities */}
                        {recentActivities.length > 0 && (
                            <>
                                <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                                    📋 Hoạt động gần đây
                                </DropdownMenuLabel>
                                {recentActivities.slice(0, 8).map((activity) => (
                                    <Link key={activity.id} href={`/tasks?taskId=${activity.task_id}`}>
                                        <DropdownMenuItem className="px-4 py-3 cursor-pointer flex-col items-start hover:bg-slate-50">
                                            <div className="flex items-start justify-between w-full mb-2">
                                                <div className="flex items-start gap-2 flex-1">
                                                    <span className="mt-0.5">{getActivityIcon(activity.action)}</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-900 text-sm">
                                                            {activity.task_title || activity.task?.title}
                                                        </p>
                                                        <p className="text-xs text-slate-600 mt-0.5">
                                                            {getActivityText(activity)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                                    {formatTimeAgo(activity.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between w-full text-xs">
                                                <span className="text-slate-400">
                                                    🕐 {formatExactTime(activity.created_at)}
                                                </span>
                                                {activity.task?.status && (
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs ${
                                                            activity.task.status === "done"
                                                                ? "bg-green-100 text-green-700"
                                                                : activity.task.status === "in-progress"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}>
                                                        {activity.task.status}
                                                    </span>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    </Link>
                                ))}
                            </>
                        )}
                    </>
                )}

                <DropdownMenuSeparator />
                <Link href="/tasks">
                    <DropdownMenuItem className="justify-center text-blue-600 cursor-pointer py-3 hover:bg-blue-50">
                        Xem tất cả tasks →
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
