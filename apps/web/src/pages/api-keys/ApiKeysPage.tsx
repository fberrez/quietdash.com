import { useEffect, useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ApiKeysService } from '@vitrine/api-client';
import { Plus, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  provider: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProvider, setNewProvider] = useState('');
  const [newKey, setNewKey] = useState('');

  const fetchApiKeys = async () => {
    try {
      const data = await ApiKeysService.apiKeysControllerFindAll();
      setApiKeys(data as ApiKey[]);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider || !newKey.trim()) return;

    setIsCreating(true);
    try {
      await ApiKeysService.apiKeysControllerCreate({
        provider: newProvider,
        apiKey: newKey,
      });
      toast.success('API key added successfully');
      setNewProvider('');
      setNewKey('');
      setIsDialogOpen(false);
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, provider: string) => {
    if (!confirm(`Are you sure you want to delete the ${provider} API key?`)) return;

    try {
      await ApiKeysService.apiKeysControllerRemove(id);
      toast.success('API key deleted');
      fetchApiKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const getProviderInfo = (provider: string) => {
    const info: Record<string, { name: string; description: string; link: string }> = {
      openweathermap: {
        name: 'OpenWeatherMap',
        description: 'Weather data for your location',
        link: 'https://openweathermap.org/api',
      },
      google_calendar: {
        name: 'Google Calendar',
        description: 'Display your upcoming events',
        link: 'https://developers.google.com/calendar',
      },
    };
    return info[provider] || { name: provider, description: 'External API service', link: '#' };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading API keys...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600 mt-1">Manage your external service API keys</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API Key</DialogTitle>
                <DialogDescription>
                  Add an API key for external services
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Service Provider</Label>
                  <Select value={newProvider} onValueChange={setNewProvider} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openweathermap">OpenWeatherMap</SelectItem>
                      <SelectItem value="google_calendar">Google Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Your API key will be encrypted and stored securely
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Adding...' : 'Add API Key'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No API keys configured</p>
              <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
                Add API keys to enable widgets like weather and calendar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apiKeys.map((apiKey) => {
              const info = getProviderInfo(apiKey.provider);
              return (
                <Card key={apiKey.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-blue-600" />
                      {info.name}
                    </CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500">
                        Added {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(apiKey.id, info.name)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Getting API Keys</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>OpenWeatherMap:</strong> Get your free API key at{' '}
              <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline">
                openweathermap.org/api
              </a>
            </p>
            <p>
              <strong>Google Calendar:</strong> Set up API access at{' '}
              <a href="https://developers.google.com/calendar" target="_blank" rel="noopener noreferrer" className="underline">
                developers.google.com/calendar
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
