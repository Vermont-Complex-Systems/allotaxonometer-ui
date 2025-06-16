<script>
    import * as d3 from "d3";
    
    import { Dashboard } from 'allotaxonometer-ui';
    import { combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } from 'allotaxonometer-ui';
    import { Slider } from "$lib/components/ui/slider/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js"; // Add this
    import { Label } from "$lib/components/ui/label/index.js"; // Add this
    import { 
        Sidebar, 
        SidebarContent, 
        SidebarHeader, 
        SidebarProvider,
        SidebarTrigger
    } from "$lib/components/ui/sidebar/index.js";
    
    import boys1895 from '../../tests/fixtures/boys-1895.json';
    import boys1968 from '../../tests/fixtures/boys-1968.json';

    // Process the data directly
    let sys1 = $state(boys1895);
    let sys2 = $state(boys1968);
    let alpha = $state(0.58);
    let title = $state(['Boys 1895', 'Boys 1968']); // Make this mutable

    let DashboardHeight = 815;
    let DashboardWidth = 1200;
    let DiamondHeight = 600;
    let DiamondWidth = DiamondHeight;
    let marginInner = 160;
    let marginDiamond = 40;

    const alphas = d3.range(0,18).map(v => +(v/12).toFixed(2)).concat([1, 2, 5, Infinity]);
    let alphaIndex = $state(7); // Start at 0.58

    $effect(() => {
        alpha = alphas[alphaIndex];
    });

    let sidebarCollapsed = $state(false);

    // File upload handling
    let fileInput1, fileInput2;
    let uploadStatus = $state('');

    async function handleFileUpload(file, system) {
        try {
            uploadStatus = `Loading ${system}...`;
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Update the appropriate system
            if (system === 'sys1') {
                sys1 = data;
                title[0] = file.name.replace('.json', '');
            } else {
                sys2 = data;
                title[1] = file.name.replace('.json', '');
            }
            
            uploadStatus = `${system.toUpperCase()} loaded successfully!`;
            setTimeout(() => uploadStatus = '', 3000);
        } catch (error) {
            uploadStatus = `Error loading ${system}: ${error.message}`;
            setTimeout(() => uploadStatus = '', 5000);
        }
    }

    // Data processing
    let me = $derived(sys1 && sys2 ? combElems(sys1, sys2) : null);
    let rtd = $derived(me ? rank_turbulence_divergence(me, alpha) : null);
    let dat = $derived(me && rtd ? diamond_count(me, rtd) : null);
    
    let barData = $derived(me && dat ? wordShift_dat(me, dat).slice(0, 30) : []);
    let balanceData = $derived(sys1 && sys2 ? balanceDat(sys1, sys2) : []);
    let maxlog10 = $derived(me ? Math.ceil(d3.max([Math.log10(d3.max(me[0].ranks)), Math.log10(d3.max(me[1].ranks))])) : 0);
    let max_count_log = $derived(dat ? Math.ceil(Math.log10(d3.max(dat.counts, d => d.value))) + 1 : 2);
    let max_shift = $derived(barData.length > 0 ? d3.max(barData, d => Math.abs(d.metric)) : 1);
    let isDataReady = $derived(dat && barData && balanceData && me && rtd);
</script>

<div class="p-30 ml-15">
<SidebarProvider>
    <div class="flex h-screen w-full">
        <!-- Sidebar -->
        <Sidebar class={sidebarCollapsed ? "w-16" : "w-80"} collapsible="icon">
            <SidebarHeader class="p-6 flex flex-row items-center justify-between">
                {#if !sidebarCollapsed}
                    <h2 class="text-xl font-semibold">Allotaxonograph</h2>
                {/if}
                <SidebarTrigger onclick={() => sidebarCollapsed = !sidebarCollapsed} />
            </SidebarHeader>
            
            {#if !sidebarCollapsed}
                <SidebarContent class="p-6 space-y-6">
                    <!-- File Upload Section -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-lg">Upload Data</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="space-y-2">
                                <Label for="file1">System 1 (JSON)</Label>
                                <Input 
                                    id="file1"
                                    type="file" 
                                    accept=".json"
                                    bind:this={fileInput1}
                                    onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys1')}
                                />
                            </div>
                            
                            <div class="space-y-2">
                                <Label for="file2">System 2 (JSON)</Label>
                                <Input 
                                    id="file2"
                                    type="file" 
                                    accept=".json"
                                    bind:this={fileInput2}
                                    onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys2')}
                                />
                            </div>
                            
                            {#if uploadStatus}
                                <div class="text-sm {uploadStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}">
                                    {uploadStatus}
                                </div>
                            {/if}
                        </CardContent>
                    </Card>

                    <Separator />

                    <!-- Alpha Control -->
                    <div class="border rounded-lg p-4 space-y-4">
                        <h3 class="text-lg font-semibold">Alpha Parameter</h3>
                        
                        <div class="text-center">
                            <span class="text-2xl font-mono">{alpha}</span>
                        </div>
                        
                        <div class="space-y-2">
                            <input 
                                type="range"
                                min="0"
                                max={alphas.length - 1}
                                value={alphaIndex}
                                oninput={(e) => alphaIndex = parseInt(e.target.value)}
                                list="alpha-settings"
                                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            
                            <datalist id="alpha-settings">
                                {#each alphas as ax, i}
                                    <option value={i} label={ax}></option>
                                {/each}
                            </datalist>
                            
                            <div class="text-xs text-muted-foreground text-center">
                                Values: 0, 0.08, 0.17, ..., 1, 2, 5, ∞
                            </div>
                        </div>
                    </div>

                    <Separator />
                        
                    <!-- Data Info -->
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-lg">Dataset</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <div class="text-sm">
                                <strong>System 1:</strong> {title[0]}
                            </div>
                            <div class="text-sm">
                                <strong>System 2:</strong> {title[1]}
                            </div>
                            {#if isDataReady}
                                <div class="text-xs text-muted-foreground mt-4">
                                    <div>Items: {me[0].ranks.length}</div>
                                    <div>Divergence: {rtd.normalization.toFixed(4)}</div>
                                </div>
                            {/if}
                        </CardContent>
                    </Card>

                    <!-- Status -->
                    <Card>
                        <CardContent class="pt-6">
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 rounded-full {isDataReady ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                                <span class="text-sm">
                                    {isDataReady ? 'Ready' : 'Processing...'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </SidebarContent>
            {:else}
                <!-- Collapsed sidebar content -->
                <SidebarContent class="p-2 space-y-4">
                    <div class="flex flex-col items-center space-y-2">
                        <div class="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                            α
                        </div>
                        <div class="text-xs text-center font-mono">
                            {alpha.toString().slice(0, 4)}
                        </div>
                    </div>
                    
                    <div class="flex justify-center">
                        <div class="w-2 h-2 rounded-full {isDataReady ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                    </div>
                </SidebarContent>
            {/if}
        </Sidebar>

        <!-- Main Content -->
        <main class="flex-1 overflow-auto">
            {#if isDataReady}
                <Dashboard 
                    {dat}
                    {alpha}
                    divnorm={rtd.normalization}
                    {barData}
                    {balanceData}
                    {title}
                    {maxlog10}
                    {max_count_log}
                    height={DashboardHeight}
                    width={DashboardWidth}
                    {DiamondHeight}
                    {DiamondWidth}
                    {marginInner}
                    {marginDiamond}
                    xDomain={[-max_shift * 1.5, max_shift * 1.5]}
                    class="dashboard"
                />
            {:else}
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p class="text-lg">Loading dashboard...</p>
                    </div>
                </div>
            {/if}
        </main>
    </div>
</SidebarProvider>
</div>

<style>
    :global(.sidebar) {
        transition: width 0.3s ease-in-out;
    }
</style>