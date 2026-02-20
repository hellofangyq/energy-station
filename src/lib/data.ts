import type { NotePreview } from "@/lib/types";

export function getDemoNotes(): NotePreview[] {
  return [
    {
      id: "demo-1",
      title: "第一次独立完成作业",
      text: "今天自己安排了作业时间，还提前复习了英语单词。",
      memberId: "demo-member-1",
      memberName: "小宇",
      senderName: "妈妈",
      createdAtLabel: "今天 19:30",
      eventDateLabel: "2026/02/20",
      statusLabel: "已接收",
      mediaType: "text"
    },
    {
      id: "demo-2",
      title: "带孩子去公园",
      text: "走了 5 公里，心情很放松。",
      memberId: "demo-member-2",
      memberName: "我",
      senderName: "我",
      createdAtLabel: "昨天 21:10",
      eventDateLabel: "2026/02/19",
      statusLabel: "已接收",
      mediaType: "image",
      mediaUrl: "/uploads/demo.jpg",
      mediaDuration: 0
    },
    {
      id: "demo-3",
      title: "练琴 30 分钟",
      text: "完成了三首新曲子。",
      memberId: "demo-member-3",
      memberName: "小希",
      senderName: "爸爸",
      createdAtLabel: "2 天前",
      eventDateLabel: "2026/02/18",
      statusLabel: "待接收",
      mediaType: "audio",
      mediaDuration: 42
    }
  ];
}
