import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import type { Material } from '@shared/schema';

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const { data: materials } = useQuery<Material[]>({ queryKey: ['/api/materials'] });
  const markMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/materials/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/materials'] })
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-xl font-bold">Materias</h1>
        <Link href="/">
          <Button variant="ghost" size="sm">Volver</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {materials?.map(m => (
          <li key={m.id} className="border border-gray-800 rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="font-medium">{m.subject} - {m.title}</div>
              <div className="text-sm text-gray-400">Tipo: {m.type === 'teoria' ? 'Teoría' : 'Práctica'}</div>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <a href={m.pdf} target="_blank" rel="noopener" className="text-blue-400 hover:underline">PDF</a>
              <Button variant="ghost" size="sm" onClick={() => markMutation.mutate(m.id)}>
                {m.seen ? <CheckCircle className="w-4 h-4 text-green-500"/> : <Circle className="w-4 h-4 text-gray-500"/>}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
