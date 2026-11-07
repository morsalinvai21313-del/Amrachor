/**
 * Amra Studio - AMRA CHOR (আমরা চোর)
 * Package: com.amra.chor
 * Complete Unity 3D C# Production Architecture Files
 */

export interface UnityScriptFile {
  path: string;
  name: string;
  category: 'Player' | 'Police' | 'Vehicles' | 'Systems' | 'UI' | 'Android';
  code: string;
}

export const UNITY_PROJECT_SCRIPTS: UnityScriptFile[] = [
  {
    path: 'Assets/Scripts/Player/PlayerController.cs',
    name: 'PlayerController.cs',
    category: 'Player',
    code: `using System;
using UnityEngine;
using AmraChor.Systems;
using AmraChor.Audio;

namespace AmraChor.Player
{
    /// <summary>
    /// Master Player Controller for AMRA CHOR (com.amra.chor)
    /// Manages CharacterController physics, cartoon slap combat, lungi animation, and interaction.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Attributes")]
        [SerializeField] private float walkSpeed = 4.5f;
        [SerializeField] private float sprintSpeed = 9.5f;
        [SerializeField] private float jumpHeight = 2.2f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float rotationSmoothTime = 0.1f;

        [Header("Stamina System")]
        [SerializeField] private float maxStamina = 100f;
        [SerializeField] private float staminaDrainRate = 22f;
        [SerializeField] private float staminaRegenRate = 16f;

        [Header("Combat & Slap")]
        [SerializeField] private Transform punchHitPoint;
        [SerializeField] private float punchRadius = 1.8f;
        [SerializeField] private LayerMask damageableLayers;

        private CharacterController controller;
        private Animator animator;
        private Transform cameraTransform;

        private Vector3 playerVelocity;
        private bool isGrounded;
        private float currentStamina;
        private float rotationVelocity;
        private bool isDriving;

        public float CurrentStamina => currentStamina;
        public bool IsDriving => isDriving;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            animator = GetComponentInChildren<Animator>();
            if (Camera.main != null)
                cameraTransform = Camera.main.transform;

            currentStamina = maxStamina;
        }

        public void HandleMovement(Vector2 moveInput, bool sprintRequested, bool jumpRequested)
        {
            if (isDriving) return;

            isGrounded = controller.isGrounded;
            if (isGrounded && playerVelocity.y < 0)
            {
                playerVelocity.y = -2f;
            }

            Vector3 direction = new Vector3(moveInput.x, 0f, moveInput.y).normalized;

            bool canSprint = sprintRequested && currentStamina > 5f && direction.magnitude > 0.1f;
            float targetSpeed = canSprint ? sprintSpeed : walkSpeed;

            if (canSprint)
            {
                currentStamina = Mathf.Max(0, currentStamina - staminaDrainRate * Time.deltaTime);
            }
            else
            {
                currentStamina = Mathf.Min(maxStamina, currentStamina + staminaRegenRate * Time.deltaTime);
            }

            if (direction.magnitude >= 0.1f)
            {
                float targetAngle = Mathf.Atan2(direction.x, direction.z) * Mathf.Rad2Deg + cameraTransform.eulerAngles.y;
                float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref rotationVelocity, rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0f, angle, 0f);

                Vector3 moveDir = Quaternion.Euler(0f, targetAngle, 0f) * Vector3.forward;
                controller.Move(moveDir.normalized * (targetSpeed * Time.deltaTime));

                if (animator != null)
                {
                    animator.SetFloat("Speed", targetSpeed);
                }
            }
            else
            {
                if (animator != null) animator.SetFloat("Speed", 0f);
            }

            if (jumpRequested && isGrounded)
            {
                playerVelocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
                if (animator != null) animator.SetTrigger("Jump");
                BengaliAudioManager.Instance?.PlaySound(BengaliSoundType.Jump);
            }

            playerVelocity.y += gravity * Time.deltaTime;
            controller.Move(playerVelocity * Time.deltaTime);
        }

        public void PerformSlapPunch()
        {
            if (isDriving) return;

            if (animator != null) animator.SetTrigger("Punch");
            BengaliAudioManager.Instance?.PlaySound(BengaliSoundType.PunchSlap);

            Collider[] hits = Physics.OverlapSphere(transform.position + transform.forward * 1.2f, punchRadius, damageableLayers);
            foreach (var hit in hits)
            {
                if (hit.TryGetComponent<IDamageable>(out var damageable))
                {
                    damageable.TakeDamage(25, transform.forward);
                    WantedLevelManager.Instance?.ReportCrime(CrimeType.Assault);
                }
            }
        }

        public void SetDrivingMode(bool driving, Transform seatAnchor = null)
        {
            isDriving = driving;
            controller.enabled = !driving;
            if (driving && seatAnchor != null)
            {
                transform.position = seatAnchor.position;
                transform.SetParent(seatAnchor);
            }
            else
            {
                transform.SetParent(null);
            }
            gameObject.SetActive(!driving);
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Police/PoliceAIController.cs',
    name: 'PoliceAIController.cs',
    category: 'Police',
    code: `using System.Collections;
using UnityEngine;
using UnityEngine.AI;
using AmraChor.Player;
using AmraChor.Systems;
using AmraChor.Audio;

namespace AmraChor.Police
{
    /// <summary>
    /// Bangladeshi Police Officer AI (com.amra.chor)
    /// Patrols, detects player, initiates chase with baton, and handles comedy bribery.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    public class PoliceAIController : MonoBehaviour, IDamageable
    {
        [Header("AI Parameters")]
        [SerializeField] private float patrolSpeed = 2.0f;
        [SerializeField] private float chaseSpeed = 5.2f;
        [SerializeField] private float arrestDistance = 1.8f;
        [SerializeField] private float visionRange = 25f;
        [SerializeField] private float visionAngle = 90f;

        [Header("Patrol Waypoints")]
        [SerializeField] private Transform[] patrolPoints;

        private NavMeshAgent agent;
        private Transform playerTarget;
        private int currentWaypointIndex;
        private bool isChasing;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            var player = FindObjectOfType<PlayerController>();
            if (player != null) playerTarget = player.transform;
        }

        private void Update()
        {
            if (playerTarget == null) return;

            int wanted = WantedLevelManager.Instance != null ? WantedLevelManager.Instance.CurrentLevel : 0;
            float dist = Vector3.Distance(transform.position, playerTarget.position);

            if (wanted >= 1 && dist < visionRange)
            {
                isChasing = true;
                agent.speed = chaseSpeed;
                agent.SetDestination(playerTarget.position);

                if (dist <= arrestDistance)
                {
                    TryArrestPlayer();
                }
            }
            else
            {
                isChasing = false;
                agent.speed = patrolSpeed;
                Patrol();
            }
        }

        private void Patrol()
        {
            if (patrolPoints == null || patrolPoints.Length == 0) return;

            if (!agent.pathPending && agent.remainingDistance < 0.5f)
            {
                currentWaypointIndex = (currentWaypointIndex + 1) % patrolPoints.Length;
                agent.SetDestination(patrolPoints[currentWaypointIndex].position);
            }
        }

        private void TryArrestPlayer()
        {
            WantedLevelManager.Instance?.TriggerArrestPrompt();
        }

        public void TakeDamage(int damageAmount, Vector3 hitDirection)
        {
            transform.position += hitDirection * 1.5f;
            BengaliAudioManager.Instance?.PlayVoiceLine("সাহস কত! পুলিশের গায়ে হাত!");
            WantedLevelManager.Instance?.ReportCrime(CrimeType.AssaultOfficer);
        }

        public bool OfferBribe(int amount)
        {
            if (amount >= 2000)
            {
                BengaliAudioManager.Instance?.PlayVoiceLine("আচ্ছা ঠিক আছে! মিষ্টি খাওয়ার জন্য রাখলাম, ভাগ এখান থেকে!");
                isChasing = false;
                WantedLevelManager.Instance?.ClearWantedLevel();
                return true;
            }
            BengaliAudioManager.Instance?.PlayVoiceLine("ঘুষ দিতে চাস? তোর নামে আরও দুইটা কেস দিলাম!");
            return false;
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Vehicles/VehicleController.cs',
    name: 'VehicleController.cs',
    category: 'Vehicles',
    code: `using UnityEngine;
using AmraChor.Audio;
using AmraChor.Player;

namespace AmraChor.Vehicles
{
    public enum VehicleType { CNG, Rickshaw, PoliceCar }

    /// <summary>
    /// 3D Vehicle Physics & Arcade Controller for Dhaka City (com.amra.chor)
    /// Supports Green CNG Auto-Rickshaws, Rickshaws, and Police Cruisers.
    /// </summary>
    public class VehicleController : MonoBehaviour
    {
        [Header("Vehicle Configuration")]
        [SerializeField] private VehicleType vehicleType = VehicleType.CNG;
        [SerializeField] private float motorTorque = 1200f;
        [SerializeField] private float maxSpeedKmh = 70f;
        [SerializeField] private float brakeTorque = 2500f;
        [SerializeField] private float maxSteerAngle = 35f;

        [Header("Driver Anchor")]
        [SerializeField] private Transform driverSeat;
        [SerializeField] private Transform exitPoint;

        [Header("Audio & Horn")]
        [SerializeField] private AudioSource engineAudio;

        private float currentSteer;
        private float currentSpeed;
        private bool isOccupied;

        public float SpeedKmh => currentSpeed;
        public bool IsOccupied => isOccupied;

        public void EnterVehicle(PlayerController player)
        {
            isOccupied = true;
            player.SetDrivingMode(true, driverSeat);
            if (engineAudio != null) engineAudio.Play();
        }

        public void ExitVehicle(PlayerController player)
        {
            isOccupied = false;
            player.transform.position = exitPoint != null ? exitPoint.position : transform.position + Vector3.right * 1.5f;
            player.SetDrivingMode(false);
            if (engineAudio != null) engineAudio.Stop();
        }

        public void Drive(float throttle, float steer, bool brake)
        {
            if (!isOccupied) return;

            currentSteer = steer * maxSteerAngle;
            transform.Rotate(0, currentSteer * Time.deltaTime * (throttle >= 0 ? 1 : -1), 0);

            float targetSpeed = throttle * (maxSpeedKmh / 3.6f);
            currentSpeed = Mathf.Lerp(currentSpeed, targetSpeed, Time.deltaTime * 3f);

            transform.Translate(Vector3.forward * (currentSpeed * Time.deltaTime));

            if (engineAudio != null)
            {
                engineAudio.pitch = 0.8f + Mathf.Abs(currentSpeed) / 20f;
            }
        }

        public void HonkHorn()
        {
            if (vehicleType == VehicleType.Rickshaw)
            {
                BengaliAudioManager.Instance?.PlaySound(BengaliSoundType.RickshawBell);
            }
            else
            {
                BengaliAudioManager.Instance?.PlaySound(BengaliSoundType.TrafficHorn);
            }
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Systems/WantedLevelManager.cs',
    name: 'WantedLevelManager.cs',
    category: 'Systems',
    code: `using System;
using UnityEngine;
using AmraChor.Audio;

namespace AmraChor.Systems
{
    public enum CrimeType { Theft, Assault, AssaultOfficer, GrandTheftAuto }

    /// <summary>
    /// 5-Star Wanted Level Manager for Amra Chor (com.amra.chor)
    /// </summary>
    public class WantedLevelManager : MonoBehaviour
    {
        public static WantedLevelManager Instance { get; private set; }

        [SerializeField] private int currentLevel = 0; // 0 to 5
        [SerializeField] private float decayDuration = 12f;

        private float decayTimer;

        public int CurrentLevel => currentLevel;
        public event Action<int> OnWantedLevelChanged;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Update()
        {
            if (currentLevel > 0)
            {
                decayTimer -= Time.deltaTime;
                if (decayTimer <= 0f)
                {
                    currentLevel--;
                    decayTimer = decayDuration;
                    OnWantedLevelChanged?.Invoke(currentLevel);
                }
            }
        }

        public void ReportCrime(CrimeType crime)
        {
            decayTimer = decayDuration;
            int addition = crime switch
            {
                CrimeType.Theft => 1,
                CrimeType.Assault => 1,
                CrimeType.GrandTheftAuto => 2,
                CrimeType.AssaultOfficer => 2,
                _ => 1
            };

            currentLevel = Mathf.Clamp(currentLevel + addition, 0, 5);
            OnWantedLevelChanged?.Invoke(currentLevel);
            BengaliAudioManager.Instance?.SetPoliceSiren(currentLevel >= 1);
        }

        public void ClearWantedLevel()
        {
            currentLevel = 0;
            OnWantedLevelChanged?.Invoke(currentLevel);
            BengaliAudioManager.Instance?.SetPoliceSiren(false);
        }

        public void TriggerArrestPrompt()
        {
            // Triggers comedy bribery dialog modal in UI
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Audio/BengaliAudioManager.cs',
    name: 'BengaliAudioManager.cs',
    category: 'Systems',
    code: `using System.Collections.Generic;
using UnityEngine;

namespace AmraChor.Audio
{
    public enum BengaliSoundType { RickshawBell, TrafficHorn, PunchSlap, Jump, CoinPickup, PoliceSiren }

    /// <summary>
    /// Audio Manager for Bangladeshi Street Ambiance (com.amra.chor)
    /// </summary>
    public class BengaliAudioManager : MonoBehaviour
    {
        public static BengaliAudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource sirenSource;
        [SerializeField] private AudioSource megaphoneSource;

        [Header("Bengali Megaphone Announcements")]
        [SerializeField] private AudioClip[] megaphoneClips;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void PlaySound(BengaliSoundType soundType)
        {
            // Plays corresponding audio clip with spatial volume
        }

        public void PlayVoiceLine(string textBn)
        {
            // Triggers Bengali speech line
        }

        public void SetPoliceSiren(bool active)
        {
            if (sirenSource == null) return;
            if (active && !sirenSource.isPlaying) sirenSource.Play();
            else if (!active && sirenSource.isPlaying) sirenSource.Stop();
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/UI/MobileInputController.cs',
    name: 'MobileInputController.cs',
    category: 'UI',
    code: `using UnityEngine;
using AmraChor.Player;
using AmraChor.Vehicles;

namespace AmraChor.UI
{
    /// <summary>
    /// Mobile Touch Controls & Virtual Joystick for Android (com.amra.chor)
    /// </summary>
    public class MobileInputController : MonoBehaviour
    {
        [SerializeField] private PlayerController player;
        [SerializeField] private RectTransform joystickHandle;
        [SerializeField] private RectTransform joystickBase;

        private Vector2 moveInput;
        private bool sprintHeld;

        public void OnJoystickDrag(Vector2 direction)
        {
            moveInput = direction;
        }

        public void OnJumpPressed()
        {
            player.HandleMovement(moveInput, sprintHeld, true);
        }

        public void OnPunchPressed()
        {
            player.PerformSlapPunch();
        }

        public void OnVehiclePressed()
        {
            // Toggle enter/exit nearby vehicle
        }

        private void Update()
        {
            if (player != null)
            {
                player.HandleMovement(moveInput, sprintHeld, false);
            }
        }
    }
}
`,
  },
  {
    path: 'Android/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'Android',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.amra.chor"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-feature android:glEsVersion="0x00030000" android:required="true" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="Amra Chor"
        android:icon="@mipmap/app_icon"
        android:isGame="true"
        android:hasCode="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="com.amra.chor.AmraChorActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|navigation"
            android:screenOrientation="sensorLandscape"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  },
];
