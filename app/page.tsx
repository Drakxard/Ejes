"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Save, Trash2, Info, ArrowLeft, Table, TrendingUp } from "lucide-react"

interface Event {
  id: string
  date: string
  name: string
  importance: number
  content: string
  theoryCompleted: number
  theoryTotal: number
  practiceCompleted: number
  practiceTotal: number
  daysRemaining: number
  isEditing: boolean
}

export default function EventTrackingSystem() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      date: "2024-08-23",
      name: "1° Parcial",
      importance: 3,
      content: "U1 A U4",
      theoryCompleted: 0,
      theoryTotal: 1,
      practiceCompleted: 0,
      practiceTotal: 1,
      daysRemaining: 0,
      isEditing: false,
    },
  ])
  const [activeTab, setActiveTab] = useState<"table" | "visual">("table")
  const [currentDate, setCurrentDate] = useState("")
  const [showInstructions, setShowInstructions] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    updateCurrentDate()
    const consent = window.confirm("¿Permitir acceso a la configuración local?")
    if (consent) {
      setHasConsent(true)
      const stored = localStorage.getItem("events")
      if (stored) {
        setEvents(JSON.parse(stored))
      }
    }
    updateAllDaysRemaining()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault()
        setActiveTab("visual")
      } else if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault()
        setActiveTab("table")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (hasConsent) {
      localStorage.setItem("events", JSON.stringify(events))
    }
  }, [events, hasConsent])

  const updateCurrentDate = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }
    setCurrentDate(today.toLocaleDateString("es-ES", options))
  }

  const calculateDaysRemaining = (targetDate: string): number => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const updateAllDaysRemaining = () => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => ({
        ...event,
        daysRemaining: event.date ? calculateDaysRemaining(event.date) : 0,
      })),
    )
  }

  const addRow = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      date: "",
      name: "",
      importance: 2,
      content: "",
      theoryCompleted: 0,
      theoryTotal: 1,
      practiceCompleted: 0,
      practiceTotal: 1,
      daysRemaining: 0,
      isEditing: true,
    }
    setEvents([...events, newEvent])
  }

  const removeRow = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
  }

  const toggleEditRow = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === id) {
          const updatedEvent = { ...event, isEditing: !event.isEditing }
          if (!updatedEvent.isEditing && updatedEvent.date) {
            updatedEvent.daysRemaining = calculateDaysRemaining(updatedEvent.date)
          }
          return updatedEvent
        }
        return event
      }),
    )
  }

  const updateEvent = (id: string, field: keyof Event, value: string | number) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === id) {
          const updatedEvent = { ...event, [field]: value }
          if (field === "date" && typeof value === "string" && value) {
            updatedEvent.daysRemaining = calculateDaysRemaining(value)
          }
          return updatedEvent
        }
        return event
      }),
    )
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date
      .toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })
      .replace(",", "")
  }

  const getDaysRemainingStyle = (days: number, importance: number) => {
    if (days <= 3 || importance === 3) {
      return "bg-red-100 text-red-800"
    } else if (days <= 7 || importance === 2) {
      return "bg-yellow-100 text-yellow-800"
    } else {
      return "bg-green-100 text-green-800"
    }
  }

  const getProgressPercent = (completed: number, total: number) => {
    if (total <= 0) return 0
    return Math.min(100, Math.round((completed / total) * 100))
  }

  const getBarColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500"
    if (percent >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getOverallProgress = () => {
    const vectors: number[] = []
    events.forEach((e) => {
      vectors.push(getProgressPercent(e.theoryCompleted, e.theoryTotal))
      vectors.push(getProgressPercent(e.practiceCompleted, e.practiceTotal))
    })
    if (vectors.length === 0) return 0
    return Math.round(vectors.reduce((a, b) => a + b, 0) / vectors.length)
  }

  const getEventCardStyle = (days: number) => {
    if (days <= 3) {
      return {
        gradient: "from-red-50 to-red-100",
        border: "border-red-200",
        title: "text-red-800",
        badge: "bg-red-200 text-red-800",
        content: "text-red-700",
        days: "text-red-600",
      }
    } else if (days <= 7) {
      return {
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200",
        title: "text-yellow-800",
        badge: "bg-yellow-200 text-yellow-800",
        content: "text-yellow-700",
        days: "text-yellow-600",
      }
    } else {
      return {
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        title: "text-green-800",
        badge: "bg-green-200 text-green-800",
        content: "text-green-700",
        days: "text-green-600",
      }
    }
  }

  const getImportanceText = (importance: number) => {
    switch (importance) {
      case 3:
        return "Alta"
      case 2:
        return "Media"
      case 1:
        return "Baja"
      default:
        return "Media"
    }
  }

  const overallProgress = getOverallProgress()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Seguimiento de Eventos</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Hoy: <span>{currentDate}</span>
                </span>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "table"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("table")}
              >
                <Table className="w-4 h-4 mr-2" />
                Tabla de Eventos
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "visual"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("visual")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Vista Visual
              </button>
            </nav>
          </div>

          {/* Table Tab Content */}
          {activeTab === "table" && (
            <div className="p-6">
              {/* Table Controls */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Eventos</h2>
                <button
                  onClick={addRow}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Fila
                </button>
              </div>

              {/* Dynamic Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importancia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contenidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Práctica
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días Restantes
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Edit className="w-4 h-4 inline mr-1" />/<Trash2 className="w-4 h-4 inline" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.isEditing ? (
                            <input
                              type="date"
                              value={event.date}
                              onChange={(e) => updateEvent(event.id, "date", e.target.value)}
                              className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-700">{formatDate(event.date)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={event.name}
                            onChange={(e) => updateEvent(event.id, "name", e.target.value)}
                            disabled={!event.isEditing}
                            placeholder="Nombre del evento"
                            className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm w-full disabled:cursor-default"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={event.importance}
                            onChange={(e) => updateEvent(event.id, "importance", Number.parseInt(e.target.value))}
                            disabled={!event.isEditing}
                            className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm disabled:cursor-default"
                          >
                            <option value={3}>3 - Alta</option>
                            <option value={2}>2 - Media</option>
                            <option value={1}>1 - Baja</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={event.content}
                            onChange={(e) => updateEvent(event.id, "content", e.target.value)}
                            disabled={!event.isEditing}
                            placeholder="Contenidos"
                            className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm w-full disabled:cursor-default"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.isEditing ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={0}
                                value={event.theoryCompleted}
                                onChange={(e) =>
                                  updateEvent(event.id, "theoryCompleted", Number(e.target.value))
                                }
                                className="w-12 border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm"
                              />
                              <span>/</span>
                              <input
                                type="number"
                                min={0}
                                value={event.theoryTotal}
                                onChange={(e) =>
                                  updateEvent(event.id, "theoryTotal", Number(e.target.value))
                                }
                                className="w-12 border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">
                              {`${event.theoryCompleted}/${event.theoryTotal}`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.isEditing ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={0}
                                value={event.practiceCompleted}
                                onChange={(e) =>
                                  updateEvent(event.id, "practiceCompleted", Number(e.target.value))
                                }
                                className="w-12 border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm"
                              />
                              <span>/</span>
                              <input
                                type="number"
                                min={0}
                                value={event.practiceTotal}
                                onChange={(e) =>
                                  updateEvent(event.id, "practiceTotal", Number(e.target.value))
                                }
                                className="w-12 border-0 bg-transparent focus:bg-white focus:border focus:border-blue-600 rounded px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">
                              {`${event.practiceCompleted}/${event.practiceTotal}`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.date
                                ? getDaysRemainingStyle(event.daysRemaining, event.importance)
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.date
                              ? event.daysRemaining > 0
                                ? `${event.daysRemaining} días`
                                : "Vencido"
                              : "Selecciona fecha"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => toggleEditRow(event.id)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              {event.isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => removeRow(event.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Visual Tab Content */}
          {activeTab === "visual" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Vista Visual - Progreso de Eventos</h2>
                <button
                  onClick={() => setActiveTab("table")}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Tabla
                </button>
              </div>

              {/* Progress Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Teoría/Práctica</h3>
                  <span className="text-2xl font-bold text-green-600">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Arrow Visualization */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Visualización de Eventos</h3>

                <div className="space-y-4">
                  {events.map((event) => {
                    const theoryPercent = getProgressPercent(
                      event.theoryCompleted,
                      event.theoryTotal,
                    )
                    const practicePercent = getProgressPercent(
                      event.practiceCompleted,
                      event.practiceTotal,
                    )
                    return (
                      <div key={event.id} className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700 w-32 truncate">
                          {event.name || "Sin nombre"}
                        </span>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-12">Teoría</span>
                            <div className="w-full bg-gray-200 rounded h-2">
                              <div
                                className={`h-2 rounded ${getBarColor(theoryPercent)}`}
                                style={{ width: `${theoryPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">{`${event.theoryCompleted}/${event.theoryTotal}`}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-12">Práctica</span>
                            <div className="w-full bg-gray-200 rounded h-2">
                              <div
                                className={`h-2 rounded ${getBarColor(practicePercent)}`}
                                style={{ width: `${practicePercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">{`${event.practiceCompleted}/${event.practiceTotal}`}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 ml-4">{event.daysRemaining} días restantes</span>
                      </div>
                    )
                  })}
                </div>

                {/* Event Details */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {events.map((event) => {
                    const styles = getEventCardStyle(event.daysRemaining)
                    return (
                      <div
                        key={event.id}
                        className={`bg-gradient-to-r ${styles.gradient} border ${styles.border} rounded-lg p-4`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${styles.title} truncate`}>{event.name || "Sin nombre"}</h4>
                          <span className={`text-xs ${styles.badge} px-2 py-1 rounded`}>
                            {getImportanceText(event.importance)}
                          </span>
                        </div>
                        <p className={`text-sm ${styles.content} mb-2`}>{event.content || "Sin contenido"}</p>
                        <p className={`text-xs ${styles.days}`}>
                          {event.daysRemaining > 0
                            ? `Faltan ${event.daysRemaining} días`
                            : event.daysRemaining === 0
                              ? "Hoy"
                              : "Vencido"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        {showInstructions && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Info className="text-blue-400 mt-0.5 mr-3 w-5 h-5" />
              <div>
                {activeTab === "table" ? (
                  <>
                    <h3 className="text-sm font-medium text-blue-800">Instrucciones</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Usa <kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl + →</kbd> para cambiar a la vista visual. Los días restantes se calculan automáticamente desde la fecha actual.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-blue-800">Vista Visual</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Los colores y tamaños de las barras cambian según la urgencia y días restantes. Usa{" "}
                      <kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl + ←</kbd> para volver a la tabla.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
