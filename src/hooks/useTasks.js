import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Hook que cuida de buscar, criar, editar e deletar tarefas no banco
export function useTasks(userId) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  // Busca as tarefas do usuário logado sempre que o userId mudar
  useEffect(() => {
    if (!userId) return
    fetchTasks()

    // Fica ouvindo mudanças em tempo real na tabela tasks
    // Se outra pessoa do time adicionar uma tarefa, aparece aqui automaticamente
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => fetchTasks() // recarrega quando qualquer coisa mudar
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setTasks(data || [])
    setLoading(false)
  }

  async function createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...taskData, user_id: userId }])
      .select()
      .single()

    if (!error && data) setTasks(prev => [data, ...prev])
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId) // segurança: só atualiza tarefa do próprio usuário
      .select()
      .single()

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data : t))
    }
    return { data, error }
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { tasks, loading, createTask, updateTask, deleteTask, fetchTasks }
}
