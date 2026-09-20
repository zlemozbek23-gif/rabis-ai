/**
 * Supabase cloud sync helpers.
 * All data is scoped under the authenticated user's UID.
 */
import { supabase, isSupabaseConfigured } from './supabase'

// ─── Profile ────────────────────────────────────────────────────────────────

export async function loadProfile(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') console.warn('loadProfile error:', error)
  return data || null
}

export async function upsertProfile(userId, profileData) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
  if (error) console.warn('upsertProfile error:', error)
}

// ─── Wardrobe ────────────────────────────────────────────────────────────────

export async function loadWardrobe(userId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.warn('loadWardrobe error:', error)
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color,
    style: row.style,
    season: row.season,
    imageUrl: row.image_url,
    analysis: row.analysis,
    createdAt: row.created_at,
  }))
}

export async function insertWardrobeItem(userId, item) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('wardrobe_items')
    .insert({
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      color: item.color,
      style: item.style,
      season: item.season,
      image_url: item.imageUrl,
      analysis: item.analysis || {},
    })
  if (error) console.warn('insertWardrobeItem error:', error)
}

export async function deleteWardrobeItemDB(itemId) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('id', itemId)
  if (error) console.warn('deleteWardrobeItem error:', error)
}

// ─── Saved Outfits ────────────────────────────────────────────────────────────

export async function loadSavedOutfits(userId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('saved_outfits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.warn('loadSavedOutfits error:', error)
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    items: row.items,
    weather: row.weather,
    savedAt: row.created_at,
  }))
}

export async function insertSavedOutfit(userId, outfit) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('saved_outfits')
    .insert({
      id: outfit.id,
      user_id: userId,
      title: outfit.title,
      description: outfit.description,
      items: outfit.items || [],
      weather: outfit.weather || null,
    })
  if (error) console.warn('insertSavedOutfit error:', error)
}

export async function deleteSavedOutfitDB(outfitId) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('saved_outfits')
    .delete()
    .eq('id', outfitId)
  if (error) console.warn('deleteSavedOutfit error:', error)
}
