using System.Text.Json;

namespace SmartEconomat.WindowsSupervisor;

public sealed class StateStore
{
    private const string StateFilePath = @"C:\ProgramData\SmartEconomat\state\supervisor-state.json";
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public async Task<SupervisorSnapshot?> LoadAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(StateFilePath))
        {
            return null;
        }

        await using var stream = File.OpenRead(StateFilePath);
        return await JsonSerializer.DeserializeAsync<SupervisorSnapshot>(stream, JsonOptions, cancellationToken);
    }

    public async Task SaveAsync(SupervisorSnapshot snapshot, CancellationToken cancellationToken)
    {
        var tempPath = $"{StateFilePath}.tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, snapshot, JsonOptions, cancellationToken);
        }

        File.Copy(tempPath, StateFilePath, overwrite: true);
        File.Delete(tempPath);
    }
}
