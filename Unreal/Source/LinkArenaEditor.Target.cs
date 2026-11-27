using UnrealBuildTool;
public class LinkArenaEditorTarget : TargetRules {
 public LinkArenaEditorTarget(TargetInfo Target) : base(Target) { Type=TargetType.Editor; DefaultBuildSettings=BuildSettingsVersion.V5; ExtraModuleNames.Add("LinkArena"); }
}