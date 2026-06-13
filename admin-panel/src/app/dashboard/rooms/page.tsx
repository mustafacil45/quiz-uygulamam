'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Users, MonitorPlay, Trash } from 'lucide-react';
import RoomDetailModal from '@/components/RoomDetailModal';

interface Room {
  id: number;
  name: string;
  is_private: boolean;
  quizzes: any[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const loadRooms = async () => {
    try {
      const res = await api.get('/rooms/');
      setRooms(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000); // Simple polling
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Bu odayı silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/rooms/${id}`);
        loadRooms();
      } catch (e) {
        console.error(e);
        alert('Oda silinirken hata oluştu.');
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Aktif Odalar</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500 transition relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{room.name}</h3>
                <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${room.is_private ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                  {room.is_private ? 'Özel Oda' : 'Herkese Açık'}
                </span>
              </div>
              <div className="bg-slate-700 p-2 rounded-full">
                <MonitorPlay size={24} className="text-blue-400" />
              </div>
            </div>


            <div className="flex items-center gap-2 text-slate-400 mb-6">
              <Users size={16} />
              <span>ID: {room.id}</span>
              <span className="ml-2 text-slate-500">({room.quizzes?.length || 0} quiz)</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRoom(room)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm font-medium transition text-slate-200"
              >
                Detaylar
              </button>
              <button
                onClick={() => handleDelete(room.id)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <RoomDetailModal
        isOpen={!!selectedRoom}
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
}
