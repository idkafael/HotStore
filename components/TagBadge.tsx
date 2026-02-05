interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className="inline-block bg-purple-primary/20 text-purple-light text-xs px-2 py-1 rounded">
      {tag}
    </span>
  );
}
